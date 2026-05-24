import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import type { EvidenceDocument } from "./contribution-types";
import { extractEvidenceDocument } from "./evidence-extraction";
import type { CreateEvidenceDocumentInput, StoredEvidenceDocument } from "./evidence-document-store";

type PrototypeEvidenceIndex = {
  updatedAt: string;
  documents: Array<
    EvidenceDocument & {
      roomSlug: string;
      topicId: string;
      topicTitle: string;
      storagePath: string;
    }
  >;
};

const defaultIndex: PrototypeEvidenceIndex = {
  updatedAt: new Date().toISOString(),
  documents: [],
};

let indexPathPromise: Promise<string> | null = null;
let uploadDirPromise: Promise<string> | null = null;
let writeQueue = Promise.resolve();

async function ensureDirectory(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

async function ensureIndexFile(filePath: string) {
  await ensureDirectory(path.dirname(filePath));

  try {
    await access(filePath);
  } catch {
    await writeFile(filePath, JSON.stringify(defaultIndex, null, 2), "utf8");
  }
}

async function resolveUploadDir() {
  if (!uploadDirPromise) {
    uploadDirPromise = (async () => {
      const preferredDir = path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "data",
        "prototype-evidence-uploads",
      );

      try {
        await ensureDirectory(preferredDir);
        return preferredDir;
      } catch {
        const fallbackDir = path.join(
          /*turbopackIgnore: true*/ tmpdir(),
          "civiclogos-prototype-evidence-uploads",
        );
        await ensureDirectory(fallbackDir);
        return fallbackDir;
      }
    })();
  }

  return uploadDirPromise;
}

async function resolveIndexPath() {
  if (!indexPathPromise) {
    indexPathPromise = (async () => {
      const preferredPath = path.join(
        /*turbopackIgnore: true*/ process.cwd(),
        "data",
        "prototype-evidence-index.runtime.json",
      );

      try {
        await ensureIndexFile(preferredPath);
        return preferredPath;
      } catch {
        const fallbackPath = path.join(
          /*turbopackIgnore: true*/ tmpdir(),
          "civiclogos-prototype-evidence-index.runtime.json",
        );
        await ensureIndexFile(fallbackPath);
        return fallbackPath;
      }
    })();
  }

  return indexPathPromise;
}

async function readIndex() {
  const indexPath = await resolveIndexPath();
  const raw = await readFile(indexPath, "utf8");
  return JSON.parse(raw) as PrototypeEvidenceIndex;
}

async function writeIndex(index: PrototypeEvidenceIndex) {
  const indexPath = await resolveIndexPath();
  index.updatedAt = new Date().toISOString();
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
}

function enqueueWrite<T>(task: () => Promise<T>) {
  const result = writeQueue.then(task, task);
  writeQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function createEvidenceDocument(
  input: CreateEvidenceDocumentInput,
): Promise<EvidenceDocument> {
  return enqueueWrite(async () => {
    const uploadDir = await resolveUploadDir();
    const index = await readIndex();
    const id = randomUUID();
    const extension = path.extname(input.fileName);
    const storagePath = path.join(uploadDir, `${id}${extension}`);
    const uploadedAt = new Date().toISOString();
    const extraction = await extractEvidenceDocument(
      input.fileName,
      input.mimeType,
      input.bytes,
    );

    await writeFile(storagePath, input.bytes);

    const documentRecord = {
      id,
      roomSlug: input.roomSlug,
      topicId: input.topicId,
      topicTitle: input.topicTitle,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.bytes.byteLength,
      uploadedAt,
      downloadHref: `/api/evidence/${id}`,
      extraction,
      storagePath,
    };

    index.documents.push(documentRecord);
    await writeIndex(index);

    return {
      id,
      fileName: documentRecord.fileName,
      mimeType: documentRecord.mimeType,
      sizeBytes: documentRecord.sizeBytes,
      uploadedAt,
      downloadHref: documentRecord.downloadHref,
      extraction,
    };
  });
}

export async function getEvidenceDocument(id: string): Promise<StoredEvidenceDocument | null> {
  const index = await readIndex();
  const record = index.documents.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  const bytes = await readFile(record.storagePath);

  return {
    document: {
      id: record.id,
      fileName: record.fileName,
      mimeType: record.mimeType,
      sizeBytes: record.sizeBytes,
      uploadedAt: record.uploadedAt,
      downloadHref: record.downloadHref,
      extraction: record.extraction,
    },
    bytes,
  };
}
