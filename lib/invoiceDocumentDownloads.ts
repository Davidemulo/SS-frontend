import {
  documentFileName,
  ipfsGatewayCandidates,
} from "@/lib/ipfs";
import {
  extractRootCid,
  verifyCid,
  type VerificationStatus,
} from "@/lib/cidVerification";

export interface DocumentDownloadProgress {
  loaded: number;
  total: number | null;
}

export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

export function invoiceDocumentFileName(
  invoiceId: string,
  reference: string,
  date = new Date(),
): string {
  const originalName = documentFileName(reference, "document");
  const extensionMatch = originalName.match(/\.[a-zA-Z0-9]{1,10}$/);
  const extension = extensionMatch?.[0].toLowerCase() ?? "";
  const documentType = (extension
    ? originalName.slice(0, -extension.length)
    : originalName
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "document";
  const safeInvoiceId = invoiceId.replace(/[^a-zA-Z0-9_-]+/g, "-");
  const dateString = date.toISOString().slice(0, 10);
  return `${safeInvoiceId}_${documentType}_${dateString}${extension}`;
}

function canonicalIpfsReference(reference: string): string {
  const cid = extractRootCid(reference);
  if (!cid || reference.startsWith("ipfs://")) return reference;

  if (/^https?:\/\//i.test(reference)) {
    const url = new URL(reference);
    const path = url.pathname.match(/\/ipfs\/[^/]+(\/.*)?$/)?.[1] ?? "";
    return `ipfs://${cid}${path}${url.search}`;
  }

  return `ipfs://${reference}`;
}

function joinChunks(chunks: Uint8Array[], byteLength: number): Uint8Array {
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function readResponseBody(
  response: Response,
  onProgress?: (progress: DocumentDownloadProgress) => void,
): Promise<Uint8Array> {
  const totalHeader = Number(response.headers.get("content-length"));
  const total = Number.isFinite(totalHeader) && totalHeader > 0 ? totalHeader : null;
  const reader = response.body?.getReader();

  if (!reader) {
    const data = new Uint8Array(await response.arrayBuffer());
    onProgress?.({ loaded: data.length, total: total ?? data.length });
    return data;
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.({ loaded, total });
  }
  onProgress?.({ loaded, total: total ?? loaded });
  return joinChunks(chunks, loaded);
}

export async function fetchVerifiedIpfsDocument(
  reference: string,
  onProgress?: (progress: DocumentDownloadProgress) => void,
  options: {
    fetcher?: typeof fetch;
    verify?: (cid: string, fetcher: typeof fetch) => Promise<VerificationStatus>;
  } = {},
): Promise<Uint8Array> {
  const cid = extractRootCid(reference);
  if (!cid) throw new Error("This document has no verifiable IPFS CID.");

  const fetcher = options.fetcher ?? fetch;
  const verify = options.verify ?? ((value, fetchImpl) => verifyCid(value, fetchImpl));
  const verification = await verify(cid, fetcher);
  if (verification !== "verified") {
    throw new Error(
      verification === "mismatch"
        ? "CID verification failed. The document was not downloaded."
        : "The document CID could not be verified. The document was not downloaded.",
    );
  }

  let lastError: Error | null = null;
  for (const url of ipfsGatewayCandidates(canonicalIpfsReference(reference))) {
    try {
      const response = await fetcher(url);
      if (!response.ok) throw new Error(`Download failed (${response.status}).`);
      return await readResponseBody(response, onProgress);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Download failed.");
    }
  }
  throw lastError ?? new Error("No IPFS gateway is available for this document.");
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of data) value = CRC_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { date: number; time: number } {
  return {
    date:
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
  };
}

export function createStoredZip(entries: ZipEntry[], date = new Date()): Blob {
  if (entries.length > 0xffff) throw new Error("Too many documents for a ZIP archive.");

  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  const { date: zipDate, time: zipTime } = dosDateTime(date);
  let localOffset = 0;
  let centralSize = 0;

  for (const entry of entries) {
    if (entry.data.length > 0xffffffff) throw new Error("A document is too large for a ZIP archive.");
    const name = encoder.encode(entry.path);
    const checksum = crc32(entry.data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, zipTime, true);
    localView.setUint16(12, zipDate, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, name.length, true);
    localView.setUint16(28, 0, true);
    local.set(name, 30);
    localParts.push(local, entry.data);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, zipTime, true);
    centralView.setUint16(14, zipDate, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, localOffset, true);
    central.set(name, 46);
    centralParts.push(central);

    localOffset += local.length + entry.data.length;
    centralSize += central.length;
  }

  if (localOffset > 0xffffffff || centralSize > 0xffffffff) {
    throw new Error("The ZIP archive is too large.");
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  endView.setUint16(20, 0, true);

  const parts = [...localParts, ...centralParts, end].map(
    (part) => new Uint8Array(part).buffer as ArrayBuffer,
  );
  return new Blob(parts, { type: "application/zip" });
}