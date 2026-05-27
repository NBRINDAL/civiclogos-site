type SignalRule = {
  label: string;
  pattern: RegExp;
  score: number;
};

export type AskSignalMatch = {
  label: string;
  score: number;
};

const healthcareSignalRules: readonly SignalRule[] = [
  {
    label: "savings-capture assumption",
    pattern:
      /(?=.*\bsavings?\b)(?=.*\b(capture|captured|pass[- ]?through|patients?|institutions?)\b).*/i,
    score: 5,
  },
  {
    label: "administrative simplification",
    pattern: /\badministrative simplification\b/i,
    score: 4,
  },
  {
    label: "AI triage",
    pattern: /\bai triage\b/i,
    score: 4,
  },
  {
    label: "human escalation",
    pattern: /\bhuman escalation\b/i,
    score: 2,
  },
  {
    label: "liability",
    pattern: /\bliability\b/i,
    score: 2,
  },
  {
    label: "transition costs",
    pattern: /\btransition costs?\b/i,
    score: 3,
  },
  {
    label: "care stakeholders",
    pattern: /\bpatients?\b|\bproviders?\b|\binsurers?\b|\bemployers?\b/i,
    score: 2,
  },
  {
    label: "healthcare institutions",
    pattern: /\bhealthcare\b|\bhospitals?\b|\bclinics?\b|\bmedicare\b|\bmedicaid\b/i,
    score: 3,
  },
] as const;

const physicsSignalRules: readonly SignalRule[] = [
  {
    label: "known symbolic sequence pattern",
    pattern: /0\s*(?:→|->)\s*i\s*\+\s*\(-i\)\s*(?:→|->)\s*i\s*[·*]\s*\(-i\)\s*(?:→|->)\s*1/i,
    score: 6,
  },
  {
    label: "quantum gravity",
    pattern: /\bquantum gravity\b/i,
    score: 5,
  },
  {
    label: "Planck",
    pattern: /\bplanck\b/i,
    score: 4,
  },
  {
    label: "quantum",
    pattern: /\bquantum\b/i,
    score: 2,
  },
  {
    label: "general relativity",
    pattern: /\bgeneral relativity\b|\brelativity\b/i,
    score: 4,
  },
  {
    label: "QM and GR baseline",
    pattern:
      /(?=.*\bgr\b)(?=.*\bqm\b).*/i,
    score: 4,
  },
  {
    label: "foundational physics",
    pattern:
      /\bfoundational physics\b|\bfoundational-science\b|\bfoundational science\b|\bphysics foundations\b/i,
    score: 4,
  },
  {
    label: "collapse sequence",
    pattern: /\bcollapse(?:-chain| sequence)?\b|\bwavefunction\b/i,
    score: 2,
  },
  {
    label: "physical structure",
    pattern: /\bphysical structure\b|\bmicrostructure\b/i,
    score: 2,
  },
  {
    label: "definitions vs evidence",
    pattern: /\bdefinitions?\b|\bempirical evidence\b|\bnot empirical evidence\b/i,
    score: 1,
  },
  {
    label: "hbar or constants",
    pattern: /\bhbar\b|\bconstants?\b/i,
    score: 2,
  },
] as const;

function dedupeSignals(signals: AskSignalMatch[]) {
  const seen = new Map<string, AskSignalMatch>();

  for (const signal of signals) {
    const existing = seen.get(signal.label);

    if (!existing || existing.score < signal.score) {
      seen.set(signal.label, signal);
    }
  }

  return [...seen.values()];
}

function collectSignals(text: string, rules: readonly SignalRule[]) {
  return dedupeSignals(
    rules.flatMap((rule) =>
      rule.pattern.test(text)
        ? [
            {
              label: rule.label,
              score: rule.score,
            },
          ]
        : [],
    ),
  );
}

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function scoreSignals(signals: readonly AskSignalMatch[]) {
  return signals.reduce((total, signal) => total + signal.score, 0);
}

function hasAnySignal(
  signals: readonly AskSignalMatch[],
  labels: readonly string[],
) {
  return signals.some((signal) => labels.includes(signal.label));
}

export function getHealthcareRoutingSignals(rawUserText: string) {
  return collectSignals(normalize(rawUserText), healthcareSignalRules);
}

export function getFoundationalPhysicsRoutingSignals(rawUserText: string) {
  const lower = normalize(rawUserText);
  const signals = collectSignals(lower, physicsSignalRules);

  if (
    (/\bsymbolic\b/i.test(lower) || /\bmathematical\b/i.test(lower)) &&
    hasAnySignal(signals, [
      "known symbolic sequence pattern",
      "quantum gravity",
      "Planck",
      "general relativity",
      "QM and GR baseline",
      "foundational physics",
      "collapse sequence",
      "physical structure",
      "hbar or constants",
    ])
  ) {
    return dedupeSignals([
      ...signals,
      {
        label: "symbolic/foundational framing",
        score: 1,
      },
    ]);
  }

  return signals;
}

export function getHealthcareRoutingScore(rawUserText: string) {
  return scoreSignals(getHealthcareRoutingSignals(rawUserText));
}

export function getFoundationalPhysicsRoutingScore(rawUserText: string) {
  return scoreSignals(getFoundationalPhysicsRoutingSignals(rawUserText));
}

export function hasSavingsCaptureSignal(rawUserText: string) {
  return getHealthcareRoutingSignals(rawUserText).some(
    (signal) => signal.label === "savings-capture assumption",
  );
}

export function hasHealthcareAskSignal(rawUserText: string) {
  const signals = getHealthcareRoutingSignals(rawUserText);
  const score = scoreSignals(signals);

  return (
    hasAnySignal(signals, [
      "savings-capture assumption",
      "administrative simplification",
      "AI triage",
    ]) ||
    (score >= 6 &&
      hasAnySignal(signals, ["healthcare institutions", "care stakeholders"]))
  );
}

export function hasSymbolicPhysicsSignal(rawUserText: string) {
  return getFoundationalPhysicsRoutingSignals(rawUserText).some((signal) =>
    signal.label === "known symbolic sequence pattern" ||
    signal.label === "collapse sequence" ||
    signal.label === "symbolic/foundational framing",
  );
}

export function hasFoundationalPhysicsSignal(rawUserText: string) {
  const signals = getFoundationalPhysicsRoutingSignals(rawUserText);
  const score = scoreSignals(signals);

  return (
    signals.some((signal) => signal.label === "known symbolic sequence pattern") ||
    signals.some((signal) => signal.label === "quantum gravity") ||
    (score >= 6 &&
      hasAnySignal(signals, [
        "Planck",
        "general relativity",
        "QM and GR baseline",
        "foundational physics",
        "collapse sequence",
      ]))
  );
}
