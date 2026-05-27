import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const baseUrl = "http://127.0.0.1:3105";
const maintainerKey = "test-maintainer-key";
const readOnlyPrompt = "What changed in this card?";
const publicHostHeaders = {
  "x-forwarded-host": "preview.civiclogos.com",
  "x-forwarded-proto": "https",
};
const demoUtterance =
  "This healthcare claim assumes savings will reach patients, but institutions may capture them.";
const healthcareLiabilityUtterance =
  "AI triage may create liability and human escalation problems.";
const healthcareTransitionUtterance =
  "Administrative simplification might have transition costs.";
const symbolicPhysicsUtterance = "0 → i + (-i) → i·(-i) → 1";
const planckUtterance =
  "Planck identities may reveal physical structure, not just definitions.";
const quantumGravityUtterance =
  "Quantum gravity needs a baseline between GR and QM.";
const ambiguousUtterance = "This seems wrong but I don’t know where it belongs.";
const affectsEveryoneUtterance = "This idea affects everyone eventually.";
const genericSystemUtterance = "The system is broken.";
const symbolicPatternUtterance = "There is a deeper symbolic pattern here.";
const genericEnergyUtterance = "Energy affects many systems.";
const physicsReadOnlyPrompt = "What are the standard baselines?";
const physicsDefinitionReadOnlyPrompt =
  "Is this treating Planck identities as definitions or physical proof?";
const rejectUtterance =
  "This healthcare claim still assumes savings will reach patients, but institutions may capture them before patients benefit.";
const archiveUtterance =
  "Planck identities and quantum gravity framing can still be overread as physical evidence when they may only be a reformulation.";

const runtimeFiles = {
  candidates: path.join(workspaceRoot, "data", "prototype-candidates.runtime.json"),
  contributions: path.join(
    workspaceRoot,
    "data",
    "prototype-contributions.runtime.json",
  ),
  reviewChat: path.join(workspaceRoot, "data", "prototype-review-chat.runtime.json"),
  reviewEvidence: path.join(
    workspaceRoot,
    "data",
    "prototype-review-evidence.runtime.json",
  ),
  topicChat: path.join(workspaceRoot, "data", "prototype-topic-chat.runtime.json"),
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function snapshotRuntimeFiles() {
  const snapshot = new Map();

  for (const [name, filePath] of Object.entries(runtimeFiles)) {
    if (await fileExists(filePath)) {
      snapshot.set(name, {
        exists: true,
        filePath,
        content: await readFile(filePath, "utf8"),
      });
      continue;
    }

    snapshot.set(name, {
      exists: false,
      filePath,
      content: null,
    });
  }

  return snapshot;
}

async function restoreRuntimeFiles(snapshot) {
  for (const entry of snapshot.values()) {
    if (entry.exists) {
      await mkdir(path.dirname(entry.filePath), { recursive: true });
      await writeFile(entry.filePath, entry.content, "utf8");
      continue;
    }

    if (await fileExists(entry.filePath)) {
      await rm(entry.filePath, { force: true });
    }
  }
}

async function stopProcessTree(child) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore",
      });
      killer.once("exit", resolve);
      killer.once("error", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function getCandidateCount() {
  if (!(await fileExists(runtimeFiles.candidates))) {
    return 0;
  }

  const document = await readJson(runtimeFiles.candidates);
  return document.candidates.length;
}

async function readRuntimeFileContent(filePath) {
  if (!(await fileExists(filePath))) {
    return null;
  }

  return readFile(filePath, "utf8");
}

class CookieJar {
  #cookies = new Map();

  apply(headers) {
    const serialized = [...this.#cookies.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

    if (serialized) {
      headers.set("cookie", serialized);
    }
  }

  capture(response) {
    const setCookieHeaders =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie")
          ? [response.headers.get("set-cookie")]
          : [];

    for (const header of setCookieHeaders) {
      if (!header) {
        continue;
      }

      const [nameValue] = header.split(";", 1);
      const separatorIndex = nameValue.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const name = nameValue.slice(0, separatorIndex).trim();
      const value = nameValue.slice(separatorIndex + 1).trim();

      if (name) {
        this.#cookies.set(name, value);
      }
    }
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000, jar) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(options.headers ?? {});

  if (jar) {
    jar.apply(headers);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      redirect: "follow",
      signal: controller.signal,
    });

    if (jar) {
      jar.capture(response);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {}, 4000);

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the server is available.
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

async function waitFor(description, check, timeoutMs = 15000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await check();
    } catch (error) {
      lastError = error;
      await delay(250);
    }
  }

  throw new Error(
    `${description} did not complete in time.${
      lastError instanceof Error ? ` ${lastError.message}` : ""
    }`,
  );
}

function ledgerSummary(ledger) {
  return {
    visibleRecords: ledger.counts.visibleRecords,
    publicSubmissions: ledger.counts.publicSubmissions,
    maintainerPromotedCandidates: ledger.counts.maintainerPromotedCandidates,
    aiOrigin: ledger.counts.aiOrigin,
    revisionEvents: ledger.revision_events.length,
    claimText: ledger.claim_record.claim_text,
    synthesisSnapshotId: ledger.topic_record.current_synthesis_snapshot_id,
  };
}

async function fetchLedger() {
  const response = await fetchWithTimeout(
    `${baseUrl}/api/ledger/healthcare/topic-001`,
    {},
    20000,
  );
  assert(response.ok, `Ledger export failed with ${response.status}.`);
  return response.json();
}

async function submitAsk(question, extraHeaders = {}) {
  const response = await fetchWithTimeout(
    `${baseUrl}/api/ai/ask`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        question,
        provider: "openai",
      }),
    },
    20000,
  );
  const payload = await response.json();
  assert(response.ok, payload.error ?? `Ask request failed with ${response.status}.`);
  return payload;
}

async function submitAskWithJar(question, cookieJar, extraHeaders = {}) {
  const response = await fetchWithTimeout(
    `${baseUrl}/api/ai/ask`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        question,
        provider: "openai",
      }),
    },
    20000,
    cookieJar,
  );
  const payload = await response.json();
  assert(response.ok, payload.error ?? `Ask request failed with ${response.status}.`);
  return payload;
}

async function submitAskExpectingError(question, expectedStatus, extraHeaders = {}) {
  const response = await fetchWithTimeout(
    `${baseUrl}/api/ai/ask`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        question,
        provider: "openai",
      }),
    },
    20000,
  );
  const payload = await response.json();
  assert(
    response.status === expectedStatus,
    `Expected ask request to fail with ${expectedStatus}, received ${response.status}.`,
  );
  return payload;
}

async function fetchHtml(pathname, extraHeaders = {}) {
  const response = await fetchWithTimeout(
    `${baseUrl}${pathname}`,
    {
      headers: extraHeaders,
    },
    20000,
  );
  assert(response.ok, `${pathname} request failed with ${response.status}.`);
  return response.text();
}

function assertExpectedCandidateShape(payload) {
  assert(payload?.candidate, "Ask response did not include a candidate.");
  assert(
    payload.candidate.proposedLane === "economic-assumption-challenge",
    `Expected lane economic-assumption-challenge, received ${payload.candidate.proposedLane}.`,
  );
  assert(
    payload.candidate.roomId === "healthcare" &&
      payload.candidate.topicId === "topic-001",
    `Expected topic healthcare/topic-001, received ${payload.candidate.roomId}/${payload.candidate.topicId}.`,
  );
  assert(
    payload.candidate.proposedAttachmentTarget?.label === "Savings-capture assumption",
    `Expected attachment target Savings-capture assumption, received ${payload.candidate.proposedAttachmentTarget?.label}.`,
  );
  assert(
    payload.candidate.evidenceStatus === "unsourced but coherent",
    `Expected evidence status unsourced but coherent, received ${payload.candidate.evidenceStatus}.`,
  );
  assert(
    JSON.stringify(payload.candidate.impactField) ===
      JSON.stringify(["patients", "providers", "insurers", "employers"]),
    `Unexpected impact field: ${payload.candidate.impactField?.join(", ")}.`,
  );
  assert(
    payload.candidate.reviewStatus === "pending_human_review",
    `Expected review status pending_human_review, received ${payload.candidate.reviewStatus}.`,
  );
  assert(
    payload.candidate.actualCardChange === false,
    "Ask candidate should report actualCardChange false.",
  );
  assert(
    payload.candidate.publicSubmission === false,
    "Ask candidate should report publicSubmission false.",
  );
  assert(
    payload.candidate.routingStatus === "routed",
    `Expected routed candidate metadata, received ${payload.candidate.routingStatus}.`,
  );
  assert(
    payload.candidate.routedRoomId === "healthcare" &&
      payload.candidate.routedTopicId === "topic-001",
    `Expected routed healthcare metadata, received ${payload.candidate.routedRoomId}/${payload.candidate.routedTopicId}.`,
  );
  assert(
    payload.candidate.routeConfidence === "high",
    `Expected high route confidence, received ${payload.candidate.routeConfidence}.`,
  );
  assert(
    payload.candidate.matchedSignals.includes("savings-capture assumption"),
    `Expected savings-capture routing signal, received ${payload.candidate.matchedSignals?.join(", ")}.`,
  );
}

function assertExpectedPhysicsCandidateShape(payload) {
  assert(
    payload?.candidate,
    `Physics ask response did not include a candidate: ${JSON.stringify({
      mode: payload?.mode,
      intent: payload?.intent,
      reply: payload?.reply,
      topic: payload?.topic,
    })}.`,
  );
  assert(
    payload.candidate.roomId === "physics-foundations" &&
      payload.candidate.topicId === "topic-001",
    `Expected Physics Foundations topic, received ${payload.candidate.roomId}/${payload.candidate.topicId}.`,
  );
  assert(
    payload.candidate.proposedLane === "proposed_reformulation" ||
      payload.candidate.proposedLane === "symbolic_interpretation",
    `Expected a symbolic physics lane, received ${payload.candidate.proposedLane}.`,
  );
  assert(
    payload.candidate.proposedAttachmentTarget?.label ===
      "Distinguish an equivalent reformulation from a new physical claim",
    `Unexpected physics attachment target ${payload.candidate.proposedAttachmentTarget?.label}.`,
  );
  assert(
    payload.candidate.evidenceStatus ===
      "symbolic/mathematical proposal, not empirical evidence",
    `Unexpected physics evidence status ${payload.candidate.evidenceStatus}.`,
  );
  assert(
    payload.candidate.reviewStatus === "pending_human_review",
    `Expected pending_human_review, received ${payload.candidate.reviewStatus}.`,
  );
  assert(
    payload.candidate.publicSubmission === false &&
      payload.candidate.actualCardChange === false,
    "Physics candidate should remain pre-ledger with no actual card change.",
  );
  assert(
    payload.candidate.routingStatus === "routed",
    `Expected routed physics metadata, received ${payload.candidate.routingStatus}.`,
  );
  assert(
    payload.candidate.routedRoomId === "physics-foundations" &&
      payload.candidate.routedTopicId === "topic-001",
    `Expected routed physics metadata, received ${payload.candidate.routedRoomId}/${payload.candidate.routedTopicId}.`,
  );
  assert(
    payload.candidate.routeConfidence === "high" ||
      payload.candidate.routeConfidence === "medium",
    `Expected medium or high route confidence, received ${payload.candidate.routeConfidence}.`,
  );
}

function assertExpectedUnroutedCandidateShape(payload) {
  assert(payload?.candidate, "Unrouted ask response did not include a candidate.");
  assert(
    payload.candidate.roomId === "unrouted" &&
      payload.candidate.topicId === "unrouted",
    `Expected unrouted candidate, received ${payload.candidate.roomId}/${payload.candidate.topicId}.`,
  );
  assert(
    payload.candidate.reviewStatus === "needs_routing",
    `Expected needs_routing, received ${payload.candidate.reviewStatus}.`,
  );
  assert(
    payload.candidate.publicSubmission === false &&
      payload.candidate.actualCardChange === false,
    "Unrouted candidate should remain pre-ledger with no actual card change.",
  );
  assert(
    payload.candidate.routingStatus === "needs_routing" ||
      payload.candidate.routingStatus === "rejected_route",
    `Expected unrouted metadata, received ${payload.candidate.routingStatus}.`,
  );
  assert(
    payload.candidate.routeConfidence === "low",
    `Expected low route confidence, received ${payload.candidate.routeConfidence}.`,
  );
}

function assertExpectedReadOnlyShape(payload) {
  assert(payload.mode === "read-only", `Expected read-only mode, received ${payload.mode}.`);
  assert(payload.candidate === null, "Read-only ask should not return a candidate.");
  assert(payload.readOnly, "Read-only ask response did not include read-only metadata.");
  assert(
    payload.readOnly.note === "This answer is read-only. No candidate was created.",
    `Unexpected read-only note: ${payload.readOnly.note}.`,
  );
  assert(
    Array.isArray(payload.readOnly.recordsUsed) && payload.readOnly.recordsUsed.length > 0,
    "Read-only ask response did not include records used.",
  );
}

function assertExpectedHealthcareRoute(payload, expectedSignals = []) {
  assert(payload?.candidate, "Healthcare route test did not include a candidate.");
  assert(
    payload.candidate.roomId === "healthcare" &&
      payload.candidate.topicId === "topic-001",
    `Expected healthcare/topic-001, received ${payload.candidate.roomId}/${payload.candidate.topicId}.`,
  );
  assert(
    payload.candidate.routingStatus === "routed",
    `Expected routed healthcare metadata, received ${payload.candidate.routingStatus}.`,
  );
  assert(
    payload.candidate.routedRoomId === "healthcare" &&
      payload.candidate.routedTopicId === "topic-001",
    `Expected healthcare routed topic metadata, received ${payload.candidate.routedRoomId}/${payload.candidate.routedTopicId}.`,
  );
  assert(
    payload.candidate.routeConfidence === "high" ||
      payload.candidate.routeConfidence === "medium",
    `Expected medium or high healthcare route confidence, received ${payload.candidate.routeConfidence}.`,
  );

  for (const signal of expectedSignals) {
    assert(
      payload.candidate.matchedSignals.includes(signal),
      `Expected healthcare matched signal ${signal}, received ${payload.candidate.matchedSignals?.join(", ")}.`,
    );
  }
}

function assertExpectedPhysicsReadOnlyShape(payload, expectedIntent) {
  assertExpectedReadOnlyShape(payload);
  assert(
    payload.intent === expectedIntent,
    `Expected physics read-only intent ${expectedIntent}, received ${payload.intent}.`,
  );
  assert(
    payload.topic.roomId === "physics-foundations" &&
      payload.topic.topicId === "topic-001",
    `Expected physics read-only topic, received ${payload.topic.roomId}/${payload.topic.topicId}.`,
  );
  assert(
    payload.reply.includes("Planck") ||
      payload.reply.includes("quantum theory") ||
      payload.reply.includes("general relativity"),
    `Physics read-only answer did not include conservative physics framing: ${payload.reply}.`,
  );
  assert(
    payload.topic.banner.includes("read-only") &&
      payload.topic.banner.includes("Physics Foundations"),
    `Unexpected physics read-only banner: ${payload.topic.banner}.`,
  );
}

function normalizeText(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=\"([^\"]*)\"`, "i"));
  return match ? match[1] : null;
}

function parseInputs(formHtml) {
  return [...formHtml.matchAll(/<input\b[^>]*>/gi)].map(([tag]) => ({
    name: getAttribute(tag, "name"),
    value: getAttribute(tag, "value") ?? "",
    type: getAttribute(tag, "type") ?? "text",
    testId: getAttribute(tag, "data-testid"),
  }));
}

function parseButtons(formHtml) {
  return [...formHtml.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)].map(
    ([, attributes, innerHtml]) => ({
      text: normalizeText(innerHtml),
      testId: getAttribute(attributes, "data-testid"),
    }),
  );
}

function extractForms(html) {
  return [...html.matchAll(/<form\b[\s\S]*?<\/form>/gi)].map(([formHtml]) => {
    const inputs = parseInputs(formHtml);
    const buttons = parseButtons(formHtml);
    const candidateId =
      inputs.find((input) => input.name === "candidateId")?.value ?? null;

    return {
      html: formHtml,
      buttons,
      candidateId,
      inputs,
    };
  });
}

function findUnlockForm(html) {
  return extractForms(html).find((form) =>
    form.inputs.some((input) => input.name === "maintainerKey"),
  );
}

function findCandidateActionForm(html, candidateId, buttonLabel) {
  return extractForms(html).find(
    (form) =>
      form.candidateId === candidateId &&
      form.buttons.some((button) => button.text === buttonLabel),
  );
}

async function fetchReviewPage(cookieJar) {
  const response = await fetchWithTimeout(
    `${baseUrl}/review/contributions`,
    {},
    20000,
    cookieJar,
  );
  assert(response.ok, `Review page request failed with ${response.status}.`);
  return response.text();
}

function buildFormData(form, overrides = {}) {
  const formData = new FormData();

  for (const input of form.inputs) {
    if (!input.name) {
      continue;
    }

    const value = Object.prototype.hasOwnProperty.call(overrides, input.name)
      ? overrides[input.name]
      : input.value;
    formData.append(input.name, value ?? "");
  }

  for (const [name, value] of Object.entries(overrides)) {
    if (!form.inputs.some((input) => input.name === name)) {
      formData.append(name, value ?? "");
    }
  }

  return formData;
}

async function submitReviewForm(cookieJar, form, overrides = {}) {
  const response = await fetchWithTimeout(
    `${baseUrl}/review/contributions`,
    {
      headers: {
        origin: baseUrl,
      },
      method: "POST",
      body: buildFormData(form, overrides),
    },
    20000,
    cookieJar,
  );

  assert(response.ok, `Review form submission failed with ${response.status}.`);
  await response.text();
}

async function unlockReviewConsole() {
  const cookieJar = new CookieJar();
  const lockedHtml = await fetchReviewPage(cookieJar);
  const unlockForm = findUnlockForm(lockedHtml);

  assert(unlockForm, "Could not find the maintainer unlock form.");
  await submitReviewForm(cookieJar, unlockForm, { maintainerKey });

  const unlockedHtml = await fetchReviewPage(cookieJar);
  assert(
    !unlockedHtml.includes("Review console locked."),
    "Maintainer review page remained locked after unlocking.",
  );

  return { cookieJar, unlockedHtml };
}

async function findPromotedContribution(candidateId) {
  const document = await readJson(runtimeFiles.contributions);
  return (
    document.contributions.find(
      (item) => item.candidateSource?.sourceCandidateId === candidateId,
    ) ?? null
  );
}

async function findCandidateRecord(candidateId) {
  const document = await readJson(runtimeFiles.candidates);
  return document.candidates.find((item) => item.id === candidateId) ?? null;
}

async function assertCandidateCount(expectedCount, label) {
  const actualCount = await getCandidateCount();
  assert(
    actualCount === expectedCount,
    `${label} should set candidate count to ${expectedCount}, received ${actualCount}.`,
  );
}

function assertLedgerUnchanged(after, before, label) {
  assert(
    after.visibleRecords === before.visibleRecords,
    `${label} changed visibleRecords from ${before.visibleRecords} to ${after.visibleRecords}.`,
  );
  assert(
    after.revisionEvents === before.revisionEvents,
    `${label} changed revision_events from ${before.revisionEvents} to ${after.revisionEvents}.`,
  );
  assert(
    after.claimText === before.claimText,
    `${label} changed the claim synthesis text.`,
  );
  assert(
    after.synthesisSnapshotId === before.synthesisSnapshotId,
    `${label} changed the current synthesis snapshot id.`,
  );
}

async function main() {
  const runtimeSnapshot = await snapshotRuntimeFiles();
  const startCommand =
    process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npm";
  const startArgs =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "npm run start -- --port 3105"]
      : ["run", "start", "--", "--port", "3105"];
  const child = spawn(startCommand, startArgs, {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: "",
      CONTACT_FROM: "",
      CONTACT_TO: "",
      CIVIC_LOGOS_MAINTAINER_KEY: maintainerKey,
      DATABASE_URL: "",
      MAINTAINER_NOTIFICATION_TO: "",
      NEXT_PUBLIC_SITE_URL: baseUrl,
      OPENAI_API_KEY: "",
      POSTGRES_PRISMA_URL: "",
      POSTGRES_URL: "",
      POSTGRES_URL_NON_POOLING: "",
      SMTP_HOST: "",
      SMTP_PASS: "",
      SMTP_PORT: "",
      SMTP_SECURE: "",
      SMTP_USER: "",
      VERCEL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const serverLogs = [];
  child.stdout.on("data", (chunk) => serverLogs.push(chunk.toString()));
  child.stderr.on("data", (chunk) => serverLogs.push(chunk.toString()));

  try {
    await waitForServer(`${baseUrl}/ask`);

    const baselineLedger = ledgerSummary(await fetchLedger());
    const baselineCandidateCount = await getCandidateCount();
    const baselineTopicChatContent = await readRuntimeFileContent(runtimeFiles.topicChat);

    const publicRootHtml = await fetchHtml("/", publicHostHeaders);
    const publicAskHtml = await fetchHtml("/ask", publicHostHeaders);
    assert(
      publicRootHtml.includes("Prototype read-only mode: durable storage is not configured"),
      "Public root shell did not show the prototype read-only storage notice.",
    );
    assert(
      publicAskHtml.includes("Prototype read-only mode: durable storage is not configured"),
      "Public /ask shell did not show the prototype read-only storage notice.",
    );

    const publicReadOnlyPayload = await submitAsk(readOnlyPrompt, publicHostHeaders);
    assertExpectedReadOnlyShape(publicReadOnlyPayload);
    const afterPublicReadOnlyLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterPublicReadOnlyLedger,
      baselineLedger,
      "Public read-only /ask",
    );
    const afterPublicReadOnlyCandidateCount = await getCandidateCount();
    assert(
      afterPublicReadOnlyCandidateCount === baselineCandidateCount,
      `Public read-only /ask changed candidate count from ${baselineCandidateCount} to ${afterPublicReadOnlyCandidateCount}.`,
    );
    const afterPublicReadOnlyTopicChatContent = await readRuntimeFileContent(
      runtimeFiles.topicChat,
    );
    assert(
      afterPublicReadOnlyTopicChatContent === baselineTopicChatContent,
      "Public read-only /ask wrote topic chat data into prototype storage.",
    );

    const blockedCandidatePayload = await submitAskExpectingError(
      demoUtterance,
      503,
      publicHostHeaders,
    );
    assert(
      blockedCandidatePayload.error?.includes(
        "Prototype read-only mode: durable storage is not configured",
      ),
      `Unexpected blocked candidate error: ${blockedCandidatePayload.error}.`,
    );
    const afterBlockedCandidateLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterBlockedCandidateLedger,
      baselineLedger,
      "Public prototype candidate block",
    );
    const afterBlockedCandidateCount = await getCandidateCount();
    assert(
      afterBlockedCandidateCount === baselineCandidateCount,
      `Blocked public candidate submission changed candidate count from ${baselineCandidateCount} to ${afterBlockedCandidateCount}.`,
    );
    const afterBlockedCandidateTopicChatContent = await readRuntimeFileContent(
      runtimeFiles.topicChat,
    );
    assert(
      afterBlockedCandidateTopicChatContent === baselineTopicChatContent,
      "Blocked public candidate submission wrote topic chat data into prototype storage.",
    );

    const readOnlyPayload = await submitAsk(readOnlyPrompt);
    assertExpectedReadOnlyShape(readOnlyPayload);
    const afterReadOnlyLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterReadOnlyLedger, baselineLedger, "Read-only /ask");
    await assertCandidateCount(baselineCandidateCount, "Read-only /ask");

    const physicsReadOnlyPayload = await submitAsk(physicsReadOnlyPrompt);
    assertExpectedPhysicsReadOnlyShape(
      physicsReadOnlyPayload,
      "standard_baselines",
    );
    const afterPhysicsReadOnlyLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterPhysicsReadOnlyLedger,
      baselineLedger,
      "Physics standard-baseline read-only /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount,
      "Physics standard-baseline read-only /ask",
    );

    const physicsDefinitionReadOnlyPayload = await submitAsk(
      physicsDefinitionReadOnlyPrompt,
    );
    assertExpectedPhysicsReadOnlyShape(
      physicsDefinitionReadOnlyPayload,
      "definition_vs_interpretation",
    );
    const afterPhysicsDefinitionReadOnlyLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterPhysicsDefinitionReadOnlyLedger,
      baselineLedger,
      "Physics definition read-only /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount,
      "Physics definition read-only /ask",
    );

    const physicsFollowUpJar = new CookieJar();
    const contextualPhysicsReadOnlyPayload = await submitAskWithJar(
      physicsReadOnlyPrompt,
      physicsFollowUpJar,
    );
    assertExpectedPhysicsReadOnlyShape(
      contextualPhysicsReadOnlyPayload,
      "standard_baselines",
    );
    const physicsFollowUpPayload = await submitAskWithJar(
      "What remains unresolved?",
      physicsFollowUpJar,
    );
    assertExpectedPhysicsReadOnlyShape(
      physicsFollowUpPayload,
      "unresolved_questions",
    );
    const afterPhysicsFollowUpLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterPhysicsFollowUpLedger,
      baselineLedger,
      "Physics contextual follow-up read-only /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount,
      "Physics contextual follow-up read-only /ask",
    );

    const askPayload = await submitAsk(demoUtterance);
    assertExpectedCandidateShape(askPayload);

    const afterAskLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterAskLedger, baselineLedger, "Candidate /ask");
    await assertCandidateCount(baselineCandidateCount + 1, "Candidate /ask");

    const healthcareLiabilityPayload = await submitAsk(healthcareLiabilityUtterance);
    assertExpectedHealthcareRoute(healthcareLiabilityPayload, [
      "AI triage",
      "human escalation",
      "liability",
    ]);
    const afterHealthcareLiabilityLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterHealthcareLiabilityLedger,
      baselineLedger,
      "Healthcare liability /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount + 2,
      "Healthcare liability /ask",
    );

    const healthcareTransitionPayload = await submitAsk(healthcareTransitionUtterance);
    assertExpectedHealthcareRoute(healthcareTransitionPayload, [
      "administrative simplification",
      "transition costs",
    ]);
    const afterHealthcareTransitionLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterHealthcareTransitionLedger,
      baselineLedger,
      "Healthcare transition /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount + 3,
      "Healthcare transition /ask",
    );

    const physicsPayload = await submitAsk(symbolicPhysicsUtterance);
    assertExpectedPhysicsCandidateShape(physicsPayload);
    assert(
      physicsPayload.candidate.roomId !== "healthcare",
      "Symbolic physics input incorrectly routed to healthcare.",
    );

    const afterPhysicsLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterPhysicsLedger, baselineLedger, "Physics /ask");
    await assertCandidateCount(baselineCandidateCount + 4, "Physics /ask");

    const planckPayload = await submitAsk(planckUtterance);
    assertExpectedPhysicsCandidateShape(planckPayload);
    assert(
      planckPayload.candidate.matchedSignals.includes("Planck") &&
        planckPayload.candidate.matchedSignals.includes("physical structure"),
      `Expected Planck and physical structure signals, received ${planckPayload.candidate.matchedSignals?.join(", ")}.`,
    );
    const afterPlanckLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterPlanckLedger, baselineLedger, "Planck /ask");
    await assertCandidateCount(baselineCandidateCount + 5, "Planck /ask");

    const quantumGravityPayload = await submitAsk(quantumGravityUtterance);
    assertExpectedPhysicsCandidateShape(quantumGravityPayload);
    assert(
      quantumGravityPayload.candidate.matchedSignals.includes("quantum gravity"),
      `Expected quantum gravity signal, received ${quantumGravityPayload.candidate.matchedSignals?.join(", ")}.`,
    );
    const afterQuantumGravityLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterQuantumGravityLedger,
      baselineLedger,
      "Quantum gravity /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount + 6,
      "Quantum gravity /ask",
    );

    const ambiguousPayload = await submitAsk(ambiguousUtterance);
    assertExpectedUnroutedCandidateShape(ambiguousPayload);

    const afterAmbiguousLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterAmbiguousLedger, baselineLedger, "Unrouted /ask");
    await assertCandidateCount(baselineCandidateCount + 7, "Unrouted /ask");

    const affectsEveryonePayload = await submitAsk(affectsEveryoneUtterance);
    assertExpectedUnroutedCandidateShape(affectsEveryonePayload);
    const afterAffectsEveryoneLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterAffectsEveryoneLedger,
      baselineLedger,
      "Affects everyone /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount + 8,
      "Affects everyone /ask",
    );

    const genericSystemPayload = await submitAsk(genericSystemUtterance);
    assertExpectedUnroutedCandidateShape(genericSystemPayload);
    assert(
      genericSystemPayload.candidate.routedRoomId !== "healthcare",
      "Generic system statement should not propose healthcare routing.",
    );
    const afterGenericSystemLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterGenericSystemLedger,
      baselineLedger,
      "Generic system /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount + 9,
      "Generic system /ask",
    );

    const symbolicPatternPayload = await submitAsk(symbolicPatternUtterance);
    assertExpectedUnroutedCandidateShape(symbolicPatternPayload);
    assert(
      symbolicPatternPayload.candidate.routedRoomId !== "physics-foundations",
      "Symbolic-only statement should not route to Physics Foundations.",
    );
    const afterSymbolicPatternLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterSymbolicPatternLedger,
      baselineLedger,
      "Symbolic-only /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount + 10,
      "Symbolic-only /ask",
    );

    const genericEnergyPayload = await submitAsk(genericEnergyUtterance);
    assertExpectedUnroutedCandidateShape(genericEnergyPayload);
    assert(
      genericEnergyPayload.candidate.routedRoomId !== "physics-foundations",
      "Generic energy statement should not route to Physics Foundations.",
    );
    const afterGenericEnergyLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterGenericEnergyLedger,
      baselineLedger,
      "Generic energy /ask",
    );
    await assertCandidateCount(
      baselineCandidateCount + 11,
      "Generic energy /ask",
    );

    const { cookieJar } = await unlockReviewConsole();
    const reviewPageBeforePromotion = await fetchReviewPage(cookieJar);
    const reviewPageBeforePromotionText = normalizeText(reviewPageBeforePromotion);
    assert(
      reviewPageBeforePromotionText.includes("Route confidence: high"),
      "Review page did not show candidate route confidence metadata.",
    );
    assert(
      reviewPageBeforePromotionText.includes("Matched signals: savings-capture assumption"),
      "Review page did not show candidate matched routing signals.",
    );
    const rerouteForm = findCandidateActionForm(
      reviewPageBeforePromotion,
      askPayload.candidate.id,
      "Reroute before promotion",
    );
    const promoteForm = findCandidateActionForm(
      reviewPageBeforePromotion,
      askPayload.candidate.id,
      "Promote to public contribution",
    );

    assert(rerouteForm, "Could not find the reroute button form for the ask candidate.");
    assert(promoteForm, "Could not find the promote button form for the ask candidate.");
    await submitReviewForm(cookieJar, promoteForm);

    const promotedContribution = await waitFor(
      "candidate promotion",
      async () => {
        const contribution = await findPromotedContribution(askPayload.candidate.id);
        assert(contribution, "Promoted contribution was not stored.");
        return contribution;
      },
      15000,
    );

    const candidateAfterPromotion = await waitFor(
      "candidate promotion status",
      async () => {
        const candidate = await findCandidateRecord(askPayload.candidate.id);
        assert(candidate, "Candidate record disappeared after promotion.");
        assert(
          candidate.reviewStatus === "promoted_to_public_contribution",
          `Candidate review status is ${candidate.reviewStatus}.`,
        );
        assert(
          candidate.promotedContributionId === promotedContribution.id,
          "Candidate promotedContributionId did not match the created contribution.",
        );
        return candidate;
      },
      15000,
    );

    const afterPromotionLedger = await waitFor(
      "ledger after promotion",
      async () => {
        const summary = ledgerSummary(await fetchLedger());
        assert(
          summary.visibleRecords === baselineLedger.visibleRecords + 1,
          `Expected visibleRecords to increment to ${baselineLedger.visibleRecords + 1}, received ${summary.visibleRecords}.`,
        );
        return summary;
      },
      15000,
    );

    assert(
      afterPromotionLedger.revisionEvents === baselineLedger.revisionEvents,
      "Promotion created a revision event.",
    );
    assert(
      afterPromotionLedger.aiOrigin === baselineLedger.aiOrigin,
      "Promotion changed the public ai-origin count.",
    );
    assert(
      afterPromotionLedger.publicSubmissions === baselineLedger.publicSubmissions,
      "Promotion changed the outside public submission count.",
    );
    assert(
      afterPromotionLedger.maintainerPromotedCandidates ===
        baselineLedger.maintainerPromotedCandidates + 1,
      "Promotion did not increment the maintainer-promoted V2 candidate count.",
    );
    assert(
      afterPromotionLedger.claimText === baselineLedger.claimText,
      "Promotion changed the live synthesis text.",
    );
    assert(
      afterPromotionLedger.synthesisSnapshotId === baselineLedger.synthesisSnapshotId,
      "Promotion changed the live synthesis snapshot id.",
    );

    assert(
      promotedContribution.status === "pending",
      `Promoted contribution should enter the public queue as pending, received ${promotedContribution.status}.`,
    );
    assert(
      !promotedContribution.draftSource,
      "Promoted contribution should not be classified as ai-origin through draftSource.",
    );
    assert(
      promotedContribution.candidateSource?.sourceCandidateId === askPayload.candidate.id,
      "Promoted contribution is missing the source candidate ID.",
    );
    assert(
      promotedContribution.candidateSource?.rawUserText === demoUtterance,
      "Promoted contribution lost the raw intake text.",
    );
    assert(
      Array.isArray(promotedContribution.candidateSource?.internalAiNotes) &&
        promotedContribution.candidateSource.internalAiNotes.length > 0,
      "Promoted contribution is missing AI structuring notes.",
    );
    assert(
      promotedContribution.candidateSource?.origin === "human_submitted_via_ai_intake",
      `Promoted contribution origin is ${promotedContribution.candidateSource?.origin}.`,
    );
    assert(
      promotedContribution.candidateSource?.aiAssisted === true,
      "Promoted contribution should preserve aiAssisted true.",
    );
    assert(
      promotedContribution.candidateSource?.publicSubmission === true,
      "Promoted contribution should mark publicSubmission true after promotion.",
    );
    assert(
      promotedContribution.candidateSource?.promotedBy ===
        "Civic Logos maintainer review",
      `Unexpected reviewer label ${promotedContribution.candidateSource?.promotedBy}.`,
    );
    assert(
      Boolean(promotedContribution.candidateSource?.promotedAt),
      "Promoted contribution is missing a promotion timestamp.",
    );

    const promotedContributionRecord = (
      await fetchLedger()
    ).contribution_records.find(
      (item) => item.contribution_id === promotedContribution.id,
    );
    assert(
      promotedContributionRecord?.origin === "maintainer_promoted_candidate",
      `Promoted record should export as maintainer_promoted_candidate, received ${promotedContributionRecord?.origin}.`,
    );

    const reviewPageAfterPromotionText = normalizeText(
      await fetchReviewPage(cookieJar),
    );
    assert(
      reviewPageAfterPromotionText.includes(
        `Source candidate ID: ${askPayload.candidate.id}`,
      ),
      "Review page did not show source candidate provenance after promotion.",
    );
    assert(
      reviewPageAfterPromotionText.includes(
        "Candidate intake origin: human_submitted_via_ai_intake",
      ),
      "Review page did not show the candidate intake origin after promotion.",
    );
    assert(
      reviewPageAfterPromotionText.includes(`Raw intake text: ${demoUtterance}`),
      "Review page did not show the preserved raw intake text after promotion.",
    );

    const reviewPageBeforeRouting = await fetchReviewPage(cookieJar);
    const routeForm = findCandidateActionForm(
      reviewPageBeforeRouting,
      ambiguousPayload.candidate.id,
      "Route to existing topic",
    );
    assert(routeForm, "Could not find the route button form for the unrouted candidate.");
    await submitReviewForm(cookieJar, routeForm, {
      routeTarget: "physics-foundations::topic-001",
    });

    const routedCandidate = await waitFor(
      "candidate routing",
      async () => {
        const candidate = await findCandidateRecord(ambiguousPayload.candidate.id);
        assert(candidate, "Routed candidate record disappeared.");
        assert(
          candidate.reviewStatus === "pending_human_review",
          `Expected routed candidate status pending_human_review, received ${candidate.reviewStatus}.`,
        );
        assert(
          candidate.roomId === "physics-foundations" && candidate.topicId === "topic-001",
          `Expected routed candidate to attach to Physics Foundations, received ${candidate.roomId}/${candidate.topicId}.`,
        );
        return candidate;
      },
      15000,
    );
    const afterRoutingLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterRoutingLedger, afterPromotionLedger, "Route action");

    const reviewPageAfterRouting = await fetchReviewPage(cookieJar);
    const routedRejectForm = findCandidateActionForm(
      reviewPageAfterRouting,
      ambiguousPayload.candidate.id,
      "Reject",
    );
    assert(routedRejectForm, "Could not find the reject button for the routed candidate.");
    await submitReviewForm(cookieJar, routedRejectForm);

    const rejectedRoutedCandidate = await waitFor(
      "candidate rejection after routing",
      async () => {
        const candidate = await findCandidateRecord(ambiguousPayload.candidate.id);
        assert(candidate, "Rejected routed candidate record disappeared.");
        assert(
          candidate.reviewStatus === "rejected",
          `Expected rejected routed candidate status, received ${candidate.reviewStatus}.`,
        );
        return candidate;
      },
      15000,
    );
    assert(
      !rejectedRoutedCandidate.promotedContributionId,
      "Rejected routed candidate should not have a promoted contribution ID.",
    );
    const afterRejectLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterRejectLedger, afterPromotionLedger, "Reject action");

    const rejectPayload = await submitAsk(rejectUtterance);
    assertExpectedCandidateShape(rejectPayload);
    const afterRejectAskLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterRejectAskLedger,
      afterPromotionLedger,
      "Reject test /ask",
    );
    await assertCandidateCount(baselineCandidateCount + 12, "Reject test /ask");

    const reviewPageBeforeReject = await fetchReviewPage(cookieJar);
    const rejectForm = findCandidateActionForm(
      reviewPageBeforeReject,
      rejectPayload.candidate.id,
      "Reject",
    );
    assert(rejectForm, "Could not find the reject button form for the test candidate.");
    await submitReviewForm(cookieJar, rejectForm);

    const rejectedCandidate = await waitFor(
      "candidate rejection",
      async () => {
        const candidate = await findCandidateRecord(rejectPayload.candidate.id);
        assert(candidate, "Rejected candidate record disappeared.");
        assert(
          candidate.reviewStatus === "rejected",
          `Expected rejected candidate status, received ${candidate.reviewStatus}.`,
        );
        return candidate;
      },
      15000,
    );
    assert(
      !rejectedCandidate.promotedContributionId,
      "Rejected candidate should not have a promoted contribution ID.",
    );

    const afterSecondRejectLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterSecondRejectLedger, afterPromotionLedger, "Second reject action");

    const archivePayload = await submitAsk(archiveUtterance);
    assertExpectedPhysicsCandidateShape(archivePayload);
    const afterArchiveAskLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(
      afterArchiveAskLedger,
      afterPromotionLedger,
      "Archive test /ask",
    );
    await assertCandidateCount(baselineCandidateCount + 13, "Archive test /ask");

    const reviewPageBeforeArchive = await fetchReviewPage(cookieJar);
    const archiveForm = findCandidateActionForm(
      reviewPageBeforeArchive,
      archivePayload.candidate.id,
      "Archive",
    );
    assert(archiveForm, "Could not find the archive button form for the test candidate.");
    await submitReviewForm(cookieJar, archiveForm);

    const archivedCandidate = await waitFor(
      "candidate archive",
      async () => {
        const candidate = await findCandidateRecord(archivePayload.candidate.id);
        assert(candidate, "Archived candidate record disappeared.");
        assert(
          candidate.reviewStatus === "archived",
          `Expected archived candidate status, received ${candidate.reviewStatus}.`,
        );
        return candidate;
      },
      15000,
    );
    assert(
      !archivedCandidate.promotedContributionId,
      "Archived candidate should not have a promoted contribution ID.",
    );

    const afterArchiveLedger = ledgerSummary(await fetchLedger());
    assertLedgerUnchanged(afterArchiveLedger, afterPromotionLedger, "Archive action");

    console.log("Candidate flow checks passed.");
    console.log(
      JSON.stringify(
        {
          askCandidateId: askPayload.candidate.id,
          physicsCandidateId: physicsPayload.candidate.id,
          unroutedCandidateId: ambiguousPayload.candidate.id,
          promotedContributionId: promotedContribution.id,
          rejectedCandidateId: rejectPayload.candidate.id,
          archivedCandidateId: archivePayload.candidate.id,
          visibleRecords: afterArchiveLedger.visibleRecords,
          revisionEvents: afterArchiveLedger.revisionEvents,
        },
        null,
        2,
      ),
    );
    console.log(
      `Promoted candidate status: ${candidateAfterPromotion.reviewStatus} -> contribution ${candidateAfterPromotion.promotedContributionId}`,
    );
    console.log(
      `Routed candidate status: ${routedCandidate.reviewStatus} at ${routedCandidate.roomId}/${routedCandidate.topicId}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const logTail = serverLogs.join("").trim().split(/\r?\n/).slice(-25).join("\n");
    throw new Error(logTail ? `${message}\n\nServer log tail:\n${logTail}` : message);
  } finally {
    await stopProcessTree(child);
    await restoreRuntimeFiles(runtimeSnapshot);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
