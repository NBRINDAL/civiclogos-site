import type { EvidenceExtraction } from "./contribution-types";

const textLikeMimePrefixes = ["text/"];
const textLikeMimeTypes = new Set([
  "application/json",
  "application/ld+json",
  "application/xml",
  "text/csv",
  "text/markdown",
]);
const textLikeExtensions = [".txt", ".md", ".markdown", ".json", ".csv", ".xml", ".html", ".htm"];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildExcerpt(value: string) {
  const normalized = normalizeWhitespace(value);
  return normalized.length > 680 ? `${normalized.slice(0, 677).trimEnd()}...` : normalized;
}

function countWords(value: string) {
  const normalized = normalizeWhitespace(value);
  return normalized ? normalized.split(" ").length : 0;
}

function isTextLike(fileName: string, mimeType: string) {
  const lowerName = fileName.toLowerCase();
  return (
    textLikeMimePrefixes.some((prefix) => mimeType.startsWith(prefix)) ||
    textLikeMimeTypes.has(mimeType) ||
    textLikeExtensions.some((extension) => lowerName.endsWith(extension))
  );
}

function isPdf(fileName: string, mimeType: string) {
  return mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
}

async function extractPdfText(bytes: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  }).promise;
  const pageTexts: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");

      pageTexts.push(pageText);
      page.cleanup();
    }

    return {
      text: pageTexts.join("\n"),
      pageCount: document.numPages,
    };
  } finally {
    await document.destroy();
  }
}

export async function extractEvidenceDocument(
  fileName: string,
  mimeType: string,
  bytes: Buffer,
): Promise<EvidenceExtraction> {
  if (isPdf(fileName, mimeType)) {
    try {
      const parsed = await extractPdfText(bytes);
      const excerpt = buildExcerpt(parsed.text);

      return {
        status: excerpt ? "completed" : "unavailable",
        excerpt: excerpt || undefined,
        wordCount: countWords(parsed.text),
        pageCount: parsed.pageCount,
        note: excerpt
          ? "Text was extracted from the uploaded PDF for review and AI-assisted sorting."
          : "The PDF uploaded successfully, but no readable text could be extracted from it.",
      };
    } catch (error) {
      console.error("PDF extraction failed", error);
      return {
        status: "error",
        note: "The PDF uploaded successfully, but text extraction failed for this file.",
      };
    }
  }

  if (isTextLike(fileName, mimeType)) {
    try {
      const text = bytes.toString("utf8");
      const excerpt = buildExcerpt(text);

      return {
        status: excerpt ? "completed" : "unavailable",
        excerpt: excerpt || undefined,
        wordCount: countWords(text),
        note: excerpt
          ? "Text was extracted from the uploaded document for review and AI-assisted sorting."
          : "The uploaded document was stored, but it did not contain readable text.",
      };
    } catch (error) {
      console.error("Text extraction failed", error);
      return {
        status: "error",
        note: "The uploaded document was stored, but text extraction failed for this file.",
      };
    }
  }

  return {
    status: "unavailable",
    note: "This file type was stored for review, but automatic text extraction is not available for it yet.",
  };
}
