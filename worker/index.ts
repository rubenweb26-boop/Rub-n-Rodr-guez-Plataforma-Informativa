import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    const url = new URL(request.url);
    const requestIsHttps = isHttpsRequest(request, url);
    if (!requestIsHttps && !isLocalHostname(url.hostname)) {
      url.protocol = "https:";
      return Response.redirect(url, 308);
    }

    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const response = await runWithConnectorBinding(binding, () =>
      handler.fetch(request, env, ctx),
    );
    return applySecurityHeaders(response, url, requestIsHttps);
  },
};

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://unpkg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://images.hoy.cr https://*.spline.design",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://*.spline.design https://unpkg.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "media-src 'self' blob: https://*.supabase.co",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Spline's scene decoder uses dynamic JavaScript evaluation. Confine that
// permission to a sandboxed iframe; the main application retains its CSP.
const splineFramePolicy = [
  "default-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
  "style-src 'unsafe-inline'",
  "connect-src https://*.spline.design https://unpkg.com",
  "img-src data: blob: https://*.spline.design",
  "worker-src blob:",
  "font-src data:",
].join("; ");

function applySecurityHeaders(
  response: Response,
  url: URL,
  requestIsHttps: boolean,
): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", url.pathname === "/spline-terminal.html" ? splineFramePolicy : contentSecurityPolicy);
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", url.pathname === "/spline-terminal.html" ? "SAMEORIGIN" : "DENY");
  headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  );
  headers.delete("Server");
  headers.delete("X-Powered-By");

  if (requestIsHttps) {
    headers.set("Strict-Transport-Security", "max-age=31536000");
  }
  if (isPrivatePath(url.pathname)) {
    headers.set("Cache-Control", "private, no-store, max-age=0");
    headers.set("Pragma", "no-cache");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function isHttpsRequest(request: Request, url: URL): boolean {
  // At the edge, `request.url` is normally already HTTPS. Read the trusted
  // proxy signal as well so an HTTP visitor is redirected before a reverse
  // proxy terminates the connection. An unrecognised value falls back to the
  // URL rather than changing the decision.
  const forwarded = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim()
    .toLowerCase();
  if (forwarded === "https") return true;
  if (forwarded === "http") return false;
  return url.protocol === "https:";
}

function isPrivatePath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/") ||
    pathname === "/mi-cuenta" ||
    pathname.startsWith("/mi-cuenta/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/denuncias" ||
    pathname.startsWith("/api/complaints") ||
    pathname.startsWith("/api/payments") ||
    pathname.startsWith("/api/webhooks")
  );
}

export default worker;
