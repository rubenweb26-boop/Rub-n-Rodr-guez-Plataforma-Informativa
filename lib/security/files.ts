const allowedFiles = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "application/pdf": ["pdf"],
  "video/mp4": ["mp4"],
  "video/webm": ["webm"],
} as const;

export type AllowedFileType = keyof typeof allowedFiles;

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

export function detectAllowedFileType(bytes: Uint8Array): AllowedFileType | null {
  if (
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff &&
    bytes[bytes.length - 1] === 0xd9
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 24 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    ) &&
    ascii(bytes, 12, 4) === "IHDR"
  ) {
    return "image/png";
  }
  if (bytes.length >= 8 && ascii(bytes, 0, 5) === "%PDF-") {
    const sample = new TextDecoder("latin1").decode(bytes.slice(0, 1_000_000));
    if (/\/(?:JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA)\b/i.test(sample)) {
      return null;
    }
    return "application/pdf";
  }
  if (bytes.length >= 16 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4);
    if (/^(?:isom|iso2|avc1|mp41|mp42|M4V )$/.test(brand)) return "video/mp4";
  }
  if (
    bytes.length >= 16 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3 &&
    new TextDecoder("latin1").decode(bytes.slice(0, 128)).toLowerCase().includes("webm")
  ) {
    return "video/webm";
  }
  return null;
}

export function fileMatchesType(file: File, detected: AllowedFileType): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type === detected && (allowedFiles[detected] as readonly string[]).includes(extension);
}

export function extensionForType(type: AllowedFileType): string {
  return type === "image/jpeg"
    ? "jpg"
    : type === "image/png"
      ? "png"
      : type === "application/pdf"
        ? "pdf"
        : type === "video/mp4"
          ? "mp4"
          : "webm";
}

export function safeAttachmentName(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\.+/, "")
      .slice(-120) || "archivo"
  );
}
