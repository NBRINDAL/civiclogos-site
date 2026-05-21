import { NextRequest, NextResponse } from "next/server";
import { getEvidenceDocument } from "@/app/lib/evidence-document-store";

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
    headers: {
      "Content-Type": storedDocument.document.mimeType || "application/octet-stream",
      "Content-Length": String(storedDocument.document.sizeBytes),
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        storedDocument.document.fileName,
      )}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
