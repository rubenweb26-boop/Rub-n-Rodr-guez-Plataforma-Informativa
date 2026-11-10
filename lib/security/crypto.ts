import "server-only";

import { env } from "cloudflare:workers";

type EncryptedEnvelope = {
  v: string;
  c: SensitiveDataContext;
  iv: string;
  data: string;
};

export type SensitiveDataContext = "complaint-payload" | "complaint-filename";
type EncryptionKeyVersion = "v1" | "v2";

/**
 * WebCrypto deliberately accepts ArrayBuffer rather than every typed-array
 * backing store. Copying also prevents a caller from mutating bytes while an
 * asynchronous crypto operation is in flight.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function keyBytes(value: string | undefined, name: string): Uint8Array {
  if (!value?.trim()) throw new Error(`${name} is unavailable.`);
  const bytes = base64UrlDecode(value.trim());
  if (bytes.byteLength !== 32) throw new Error(`${name} must decode to exactly 32 bytes.`);
  return bytes;
}

function isEncryptionKeyVersion(value: string): value is EncryptionKeyVersion {
  return value === "v1" || value === "v2";
}

function configuredKeyVersion(): EncryptionKeyVersion {
  const version = env.DATA_ENCRYPTION_KEY_VERSION?.trim() || "v1";
  if (!isEncryptionKeyVersion(version)) {
    throw new Error("Configured encryption key version is unsupported.");
  }
  return version;
}

function keyForVersion(version: EncryptionKeyVersion): Uint8Array {
  return version === "v1"
    ? keyBytes(env.DATA_ENCRYPTION_KEY_V1, "DATA_ENCRYPTION_KEY_V1")
    : keyBytes(env.DATA_ENCRYPTION_KEY_V2, "DATA_ENCRYPTION_KEY_V2");
}

function additionalData(
  context: SensitiveDataContext,
  version: EncryptionKeyVersion,
): ArrayBuffer {
  return toArrayBuffer(new TextEncoder().encode(`rubenweb:${context}:${version}`));
}

export async function encryptSensitiveJson(
  value: unknown,
  context: SensitiveDataContext,
): Promise<string> {
  const version = configuredKeyVersion();
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyForVersion(version)),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(iv),
      additionalData: additionalData(context, version),
    },
    key,
    toArrayBuffer(plaintext),
  );
  const envelope: EncryptedEnvelope = {
    v: version,
    c: context,
    iv: base64UrlEncode(iv),
    data: base64UrlEncode(new Uint8Array(encrypted)),
  };
  return JSON.stringify(envelope);
}

export async function decryptSensitiveJson<T>(
  payload: string,
  context: SensitiveDataContext,
): Promise<T> {
  const envelope = JSON.parse(payload) as Partial<EncryptedEnvelope>;
  if (!envelope.v || !envelope.c || !envelope.iv || !envelope.data) {
    throw new Error("Encrypted payload is invalid.");
  }
  if (!isEncryptionKeyVersion(envelope.v)) {
    throw new Error("Encrypted payload uses an unavailable key version.");
  }
  if (envelope.c !== context) {
    throw new Error("Encrypted payload context is invalid.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(keyForVersion(envelope.v)),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(base64UrlDecode(envelope.iv)),
      additionalData: additionalData(context, envelope.v),
    },
    key,
    toArrayBuffer(base64UrlDecode(envelope.data)),
  );
  return JSON.parse(new TextDecoder().decode(decrypted)) as T;
}

export async function hmacPseudonym(
  value: string,
  secret = env.AUDIT_HMAC_KEY,
): Promise<string | null> {
  if (!value || !secret?.trim()) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(new TextEncoder().encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    toArrayBuffer(new TextEncoder().encode(value)),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
