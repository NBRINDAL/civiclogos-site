import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const readOnlyPrompt = "What changed in this card?";
const contributionPrompt =
  "This healthcare claim assumes savings will reach patients, but institutions may capture them.";
const execFileAsync = promisify(execFile);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeBaseUrl(value) {
  if (!value) {
    throw new Error(
      "Usage: node scripts/check-https-smoke.mjs https://your-preview-or-production-url",
    );
  }

  const url = new URL(value);
  url.pathname = "";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function normalizeText(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isProtectedVercelPreview(baseUrl) {
  const hostname = new URL(baseUrl).hostname.toLowerCase();
  return hostname.endsWith(".vercel.app");
}

async function runVercelCurl(baseUrl, pathname, options = {}) {
  const method = options.method ?? "GET";
  const body =
    typeof options.body === "string"
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : null;
  const headers = Object.entries(options.headers ?? {});
  const curlArgs = [
    "--yes",
    "vercel",
    "curl",
    pathname,
    "--deployment",
    baseUrl,
    "--",
    "--silent",
    "--show-error",
    "--write-out",
    "__STATUS__:%{http_code}",
    "--request",
    method,
  ];

  for (const [name, value] of headers) {
    curlArgs.push("--header", `${name}: ${value}`);
  }

  if (body !== null && process.platform !== "win32") {
    curlArgs.push("--data", body);
  }

  const result =
    process.platform === "win32"
      ? await (async () => {
          let tempDirPath = null;
          const psArrayItems = curlArgs
            .map((value) => `'${String(value).replace(/'/g, "''")}'`)
            .join(", ");
          const psCommand = [
            `$cmd = '${(process.env.ProgramFiles ?? "C:\\Program Files").replace(/'/g, "''")}\\nodejs\\npx.cmd'`,
            `$args = @(${psArrayItems})`,
          ];

          if (body !== null) {
            tempDirPath = await mkdtemp(path.join(os.tmpdir(), "civiclogos-smoke-"));
            const payloadPath = path.join(tempDirPath, "payload.json");
            await writeFile(payloadPath, body, "utf8");
            psCommand.push(
              `$args += @('--data-binary', '@${payloadPath.replace(/'/g, "''")}')`,
            );
          }

          psCommand.push("& $cmd @args");
          try {
            return await execFileAsync(
              "powershell.exe",
              ["-NoProfile", "-Command", psCommand.join("; ")],
              {
                cwd: process.cwd(),
                maxBuffer: 20_000_000,
                windowsHide: true,
              },
            );
          } finally {
            if (tempDirPath) {
              await rm(tempDirPath, { force: true, recursive: true });
            }
          }
        })()
      : await new Promise((resolve, reject) => {
          const child = spawn("npx", curlArgs, {
            cwd: process.cwd(),
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
          });
          let stdout = "";
          let stderr = "";

          child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
          });
          child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
          });
          child.once("error", reject);
          child.once("exit", (code) => {
            if (code !== 0) {
              reject(
                new Error(
                  `vercel curl ${pathname} failed with exit code ${code}.${stderr ? ` ${stderr.trim()}` : ""}`,
                ),
              );
              return;
            }

            resolve({ stderr, stdout });
          });
        });
  const output = result.stdout;
  const marker = "__STATUS__:";
  const markerIndex = output.lastIndexOf(marker);
  assert(markerIndex >= 0, `Could not parse HTTP status from vercel curl output for ${pathname}.`);
  const bodyText = output.slice(0, markerIndex);
  const statusText = output.slice(markerIndex + marker.length).trim();
  const status = Number(statusText);
  assert(Number.isFinite(status), `Invalid HTTP status from vercel curl for ${pathname}: ${statusText}`);

  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => bodyText,
    json: async () => JSON.parse(bodyText),
  };
}

async function request(baseUrl, pathname, options = {}) {
  if (isProtectedVercelPreview(baseUrl)) {
    return runVercelCurl(baseUrl, pathname, options);
  }

  return fetchWithTimeout(`${baseUrl}${pathname}`, options);
}

async function fetchHtml(url) {
  const baseUrl = normalizeBaseUrl(url);
  const pathname = new URL(url).pathname + new URL(url).search;
  const response = await request(baseUrl, pathname);
  const body = await response.text();
  assert(response.ok, `GET ${url} failed with ${response.status}.`);
  return normalizeText(body);
}

async function fetchJson(url, options = {}) {
  const parsed = new URL(url);
  const response = await request(
    normalizeBaseUrl(url),
    parsed.pathname + parsed.search,
    options,
  );
  const payload = await response.json();
  return { response, payload };
}

function ledgerSummary(ledger) {
  return {
    visibleRecords: ledger.counts.visibleRecords,
    revisionEvents: ledger.revision_events.length,
    synthesisSnapshotId: ledger.topic_record.current_synthesis_snapshot_id,
    claimText: ledger.claim_record.claim_text,
  };
}

function assertLedgerUnchanged(after, before, label) {
  assert(
    after.visibleRecords === before.visibleRecords,
    `${label} changed visibleRecords from ${before.visibleRecords} to ${after.visibleRecords}.`,
  );
  assert(
    after.revisionEvents === before.revisionEvents,
    `${label} changed revisionEvents from ${before.revisionEvents} to ${after.revisionEvents}.`,
  );
  assert(
    after.synthesisSnapshotId === before.synthesisSnapshotId,
    `${label} changed synthesis snapshot ID.`,
  );
  assert(
    after.claimText === before.claimText,
    `${label} changed synthesis text.`,
  );
}

async function fetchLedger(baseUrl) {
  const { response, payload } = await fetchJson(
    `${baseUrl}/api/ledger/healthcare/topic-001`,
  );
  assert(
    response.ok,
    `Ledger export failed with ${response.status}: ${JSON.stringify(payload)}`,
  );
  return payload;
}

async function submitAsk(baseUrl, question) {
  const { response, payload } = await fetchJson(`${baseUrl}/api/ai/ask`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      question,
      provider: "openai",
    }),
  });

  return { response, payload };
}

function assertReadOnlyAnswer(payload) {
  assert(payload.mode === "read-only", `Expected read-only mode, received ${payload.mode}.`);
  assert(payload.candidate === null, "Read-only ask unexpectedly returned a candidate.");
  assert(
    payload.readOnly?.note === "This answer is read-only. No candidate was created.",
    `Unexpected read-only note: ${payload.readOnly?.note}`,
  );
  assert(
    Array.isArray(payload.readOnly?.recordsUsed) && payload.readOnly.recordsUsed.length > 0,
    "Read-only answer did not include records used.",
  );
}

function assertContributionCandidate(payload) {
  assert(payload.mode === "candidate", `Expected candidate mode, received ${payload.mode}.`);
  assert(payload.candidate, "Contribution ask did not return a candidate.");
  assert(
    payload.candidate.proposedLane === "economic-assumption-challenge",
    `Unexpected candidate lane ${payload.candidate.proposedLane}.`,
  );
  assert(
    payload.candidate.roomId === "healthcare" && payload.candidate.topicId === "topic-001",
    `Unexpected candidate topic ${payload.candidate.roomId}/${payload.candidate.topicId}.`,
  );
  assert(
    payload.candidate.proposedAttachmentTarget?.label === "Savings-capture assumption",
    `Unexpected attachment target ${payload.candidate.proposedAttachmentTarget?.label}.`,
  );
  assert(
    payload.candidate.evidenceStatus === "unsourced but coherent",
    `Unexpected evidence status ${payload.candidate.evidenceStatus}.`,
  );
  assert(
    JSON.stringify(payload.candidate.impactField) ===
      JSON.stringify(["patients", "providers", "insurers", "employers"]),
    `Unexpected impact field ${JSON.stringify(payload.candidate.impactField)}.`,
  );
  assert(
    payload.candidate.reviewStatus === "pending_human_review",
    `Unexpected review status ${payload.candidate.reviewStatus}.`,
  );
  assert(
    payload.candidate.actualCardChange === false,
    "Candidate should report actualCardChange false.",
  );
  assert(
    payload.candidate.publicSubmission === false,
    "Candidate should report publicSubmission false.",
  );
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.argv[2]);

  const pageChecks = [
    ["/", "Make chat the front door"],
    ["/ask", "Make chat the front door"],
    ["/about", "Where civilization thinks in public."],
    ["/ledger", "V2 candidate intake is active."],
    ["/demo", "This healthcare claim assumes savings will reach patients, but institutions may capture them."],
    ["/healthcare/topic-001?view=ledger", "Administrative Simplification and AI-Assisted Triage"],
    ["/review/contributions", "Review console locked."],
  ];

  for (const [pathname, expectedText] of pageChecks) {
    const text = await fetchHtml(`${baseUrl}${pathname}`);
    assert(
      text.includes(expectedText),
      `${pathname} did not include expected text: ${expectedText}`,
    );
  }

  const baselineLedger = ledgerSummary(await fetchLedger(baseUrl));

  const readOnlyResult = await submitAsk(baseUrl, readOnlyPrompt);
  assert(
    readOnlyResult.response.ok,
    `Read-only ask failed with ${readOnlyResult.response.status}: ${JSON.stringify(readOnlyResult.payload)}`,
  );
  assertReadOnlyAnswer(readOnlyResult.payload);
  const afterReadOnlyLedger = ledgerSummary(await fetchLedger(baseUrl));
  assertLedgerUnchanged(afterReadOnlyLedger, baselineLedger, "Read-only ask");

  const contributionResult = await submitAsk(baseUrl, contributionPrompt);
  const afterContributionLedger = ledgerSummary(await fetchLedger(baseUrl));

  if (contributionResult.response.status === 503) {
    assert(
      contributionResult.payload.error?.includes(
        "Prototype read-only mode: durable storage is not configured",
      ),
      `Unexpected read-only block error: ${contributionResult.payload.error}`,
    );
    assertLedgerUnchanged(
      afterContributionLedger,
      baselineLedger,
      "Contribution ask in prototype read-only mode",
    );
    console.log(
      JSON.stringify(
        {
          baseUrl,
          candidateIntake: "prototype-read-only",
          visibleRecords: baselineLedger.visibleRecords,
          revisionEvents: baselineLedger.revisionEvents,
        },
        null,
        2,
      ),
    );
    return;
  }

  assert(
    contributionResult.response.ok,
    `Contribution ask failed with ${contributionResult.response.status}: ${JSON.stringify(contributionResult.payload)}`,
  );
  assertContributionCandidate(contributionResult.payload);
  assertLedgerUnchanged(afterContributionLedger, baselineLedger, "Contribution ask");

  console.log(
    JSON.stringify(
      {
        baseUrl,
        candidateIntake: "database-enabled",
        candidateId: contributionResult.payload.candidate.id,
        visibleRecords: baselineLedger.visibleRecords,
        revisionEvents: baselineLedger.revisionEvents,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
