import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const maxTextFileBytes = 8 * 1024 * 1024;

const rules = [
  {
    id: "private-key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
  },
  {
    id: "aws-access-key",
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: "google-api-key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: "github-token",
    pattern: /\bgh[pousr]_[0-9A-Za-z]{20,255}\b/g,
  },
  {
    id: "npm-token",
    pattern: /\bnpm_[0-9A-Za-z]{20,255}\b/g,
  },
  {
    id: "slack-token",
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{20,255}\b/g,
  },
  {
    id: "payment-secret",
    pattern: /\bsk_(?:live|test)_[0-9A-Za-z]{12,255}\b/g,
  },
  {
    id: "jwt",
    pattern:
      /\beyJ[0-9A-Za-z_-]{8,}\.[0-9A-Za-z_-]{8,}\.[0-9A-Za-z_-]{8,}\b/g,
  },
  {
    id: "environment-secret",
    pattern:
      /\b[A-Z][A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE_KEY|ENCRYPTION_KEY|CLIENT_SECRET|SERVICE_ROLE_KEY)[A-Z0-9_]*\s*=\s*(?:"([^"\r\n]{8,})"|'([^'\r\n]{8,})'|([^\s#'"]{8,}))/g,
    valueGroups: [1, 2, 3],
  },
  {
    id: "code-secret-literal",
    pattern:
      /\b(?:apiKey|secretKey|clientSecret|serviceRoleKey|password|encryptionKey|privateKey)\s*[:=]\s*(?:"([^"\r\n]{8,})"|'([^'\r\n]{8,})')/g,
    valueGroups: [1, 2],
  },
];

const findings = new Map();
let scannedCurrentFiles = 0;
let skippedLargeFiles = 0;

function runGit(args, encoding = "utf8") {
  try {
    return execFileSync("git", ["-C", repositoryRoot, ...args], {
      encoding,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch {
    throw new Error("The repository secret scan could not read Git metadata.");
  }
}

function safeLocation(value) {
  return value.replace(/[^\x20-\x7e]/g, "?").slice(0, 500);
}

function looksLikePlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length < 8 ||
    /^(?:x+|\*+|-+|_+)$/.test(normalized) ||
    /(?:example|sample|fixture|placeholder|change[-_ ]?me|replace[-_ ]?me|dummy|redacted|not[-_ ]?a[-_ ]?secret|your[-_ ]|process\.env|import\.meta\.env|\$\{|<[^>]+>)/.test(
      normalized,
    )
  );
}

function recordFinding({ scope, commit, file, line, rule }) {
  const shortCommit = commit ? commit.slice(0, 12) : null;
  const key = [scope, shortCommit, file, line, rule].join("|");
  findings.set(key, {
    scope,
    commit: shortCommit,
    file: safeLocation(file),
    line,
    rule,
  });
}

function scanLine(text, location) {
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of text.matchAll(rule.pattern)) {
      if (
        rule.id === "jwt" &&
        /\b(?:NEXT_PUBLIC_)?SUPABASE_ANON_KEY\b/.test(text)
      ) {
        continue;
      }

      if (rule.valueGroups) {
        const candidate = rule.valueGroups
          .map((group) => match[group])
          .find(Boolean);
        if (!candidate || looksLikePlaceholder(candidate)) continue;
      }

      recordFinding({ ...location, rule: rule.id });
    }
  }
}

function scanText(text, location) {
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    scanLine(lines[index], { ...location, line: index + 1 });
  }
}

function scanCurrentTree() {
  // Include untracked, non-ignored files too: a credential is most likely to
  // leak immediately before its first commit. Ignored local `.env` files stay
  // out of this scan so their legitimate local values are neither inspected
  // nor reported by a developer command.
  const output = runGit([
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ]);
  const files = output.split("\0").filter(Boolean);

  for (const relativePath of files) {
    const absolutePath = path.join(repositoryRoot, relativePath);
    let contents;
    try {
      contents = readFileSync(absolutePath);
    } catch {
      continue;
    }
    if (contents.length > maxTextFileBytes) {
      skippedLargeFiles += 1;
      continue;
    }
    if (contents.includes(0)) continue;

    scannedCurrentFiles += 1;
    scanText(contents.toString("utf8"), {
      scope: "current",
      commit: null,
      file: relativePath,
    });
  }
}

function scanHistory() {
  const patch = runGit([
    "log",
    "--all",
    "--no-ext-diff",
    "--no-renames",
    "--unified=0",
    "--format=SECRET_SCAN_COMMIT:%H",
    "-p",
    "--",
    ".",
  ]);

  let commit = "unknown";
  let file = "unknown";
  let oldLine = 0;
  let newLine = 0;

  for (const line of patch.split(/\r?\n/)) {
    if (line.startsWith("SECRET_SCAN_COMMIT:")) {
      commit = line.slice("SECRET_SCAN_COMMIT:".length);
      continue;
    }
    if (line.startsWith("+++ b/")) {
      file = line.slice(6);
      continue;
    }
    if (line.startsWith("--- a/")) {
      if (file === "unknown") file = line.slice(6);
      continue;
    }
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      continue;
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      scanLine(line.slice(1), {
        scope: "history",
        commit,
        file,
        line: newLine,
      });
      newLine += 1;
      continue;
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      scanLine(line.slice(1), {
        scope: "history",
        commit,
        file,
        line: oldLine,
      });
      oldLine += 1;
      continue;
    }
    if (!line.startsWith("\\")) {
      oldLine += 1;
      newLine += 1;
    }
  }
}

scanCurrentTree();
scanHistory();

if (findings.size > 0) {
  console.error(
    `[secret-scan] Found ${findings.size} credential-like location(s). Values are intentionally redacted.`,
  );
  for (const finding of findings.values()) {
    const commitPart = finding.commit
      ? ` commit=${finding.commit}`
      : "";
    console.error(
      `[secret-scan] scope=${finding.scope}${commitPart} file=${finding.file} line=${finding.line} rule=${finding.rule}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    `[secret-scan] No credential patterns found in ${scannedCurrentFiles} versioned or unignored text files, or Git history.`,
  );
  if (skippedLargeFiles > 0) {
    console.log(
      `[secret-scan] Skipped ${skippedLargeFiles} tracked file(s) larger than ${maxTextFileBytes} bytes.`,
    );
  }
}
