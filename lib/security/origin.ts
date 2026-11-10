export function isSameOriginMutation(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  return origin === requestOrigin && (!fetchSite || fetchSite === "same-origin");
}

export function hasContentType(request: Request, expected: string): boolean {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  return mediaType?.toLowerCase() === expected.toLowerCase();
}

export function exceedsDeclaredSize(request: Request, maximumBytes: number): boolean {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const size = Number(raw);
  return !Number.isSafeInteger(size) || size < 0 || size > maximumBytes;
}

export async function readRequestWithLimit(
  request: Request,
  maximumBytes: number,
): Promise<Uint8Array> {
  if (exceedsDeclaredSize(request, maximumBytes)) {
    throw new RequestBodyTooLargeError();
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the configured limit.");
    this.name = "RequestBodyTooLargeError";
  }
}
