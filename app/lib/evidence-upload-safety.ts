const pdfMimeType = "application/pdf";
const plainTextMimeType = "text/plain";
const markdownMimeType = "text/markdown";

function getLowerExtension(fileName: string) {
  return fileName.toLowerCase().split(".").pop() ?? "";
}

export function isAllowedEvidenceUpload(input: {
  fileName?: string;
  mimeType?: string;
}) {
  const mimeType = input.mimeType?.toLowerCase().trim() ?? "";
  const extension = getLowerExtension(input.fileName ?? "");

  return (
    mimeType === pdfMimeType ||
    mimeType === plainTextMimeType ||
    mimeType === markdownMimeType ||
    extension === "pdf" ||
    extension === "txt" ||
    extension === "md"
  );
}

export function getSafeEvidenceDownloadHeaders(input: {
  fileName: string;
  mimeType?: string;
  sizeBytes: number;
}) {
  const mimeType = input.mimeType?.toLowerCase().trim() ?? "";
  const extension = getLowerExtension(input.fileName);
  const contentType =
    mimeType === pdfMimeType || extension === "pdf"
      ? pdfMimeType
      : mimeType === plainTextMimeType ||
          mimeType === markdownMimeType ||
          extension === "txt" ||
          extension === "md"
        ? plainTextMimeType
        : "application/octet-stream";
  const disposition = contentType === pdfMimeType ? "inline" : "attachment";

  return {
    "Cache-Control": "private, max-age=300",
    "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(
      input.fileName || "evidence-document",
    )}`,
    "Content-Length": String(input.sizeBytes),
    "Content-Security-Policy": "sandbox",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  };
}
