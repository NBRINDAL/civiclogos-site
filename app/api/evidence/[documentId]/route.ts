import { NextRequest, NextResponse } from "next/server";
import { getEvidenceDocument } from "@/app/lib/evidence-document-store";
import { getSafeEvidenceDownloadHeaders } from "@/app/lib/evidence-upload-safety";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await params;
  const trimmedId = documentId.trim();

  if (!trimmedId) {
    return NextResponse.json({ error: "Missing evidence document id." }, { status: 400 });
  }

  const storedDocument = await getEvidenceDocument(trimmedId);

  if (!storedDocument) {
    return NextResponse.json({ error: "Evidence document not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(storedDocument.bytes), {
    status: 200,
    headers: getSafeEvidenceDownloadHeaders({
      fileName: storedDocument.document.fileName,
      mimeType: storedDocument.document.mimeType,
      sizeBytes: storedDocument.document.sizeBytes,
    }),
  });
}
