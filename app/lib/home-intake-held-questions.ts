import type {
  HomeIntakeRouting,
  ProviderHomeIntakeRouting,
} from "./home-intake-types";

export type HomeIntakeHeldQuestion = {
  question: string;
  provenanceLabel: string;
};

function getProviderLabel(provider: ProviderHomeIntakeRouting["provider"]) {
  return provider === "openai" ? "OpenAI" : "Claude";
}

function normalizeQuestion(question: string) {
  return question.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getHomeIntakeHeldQuestions(
  routing: HomeIntakeRouting,
  limit = 3,
): HomeIntakeHeldQuestion[] {
  const questionMap = new Map<
    string,
    {
      question: string;
      providers: Set<string>;
      fromVisibleRouting: boolean;
      order: number;
    }
  >();
  let order = 0;

  const addQuestion = (
    question: string,
    options?: { providerLabel?: string; fromVisibleRouting?: boolean },
  ) => {
    const normalized = normalizeQuestion(question);
    if (!normalized) {
      return;
    }

    const existing = questionMap.get(normalized);
    if (existing) {
      if (options?.providerLabel) {
        existing.providers.add(options.providerLabel);
      }
      if (options?.fromVisibleRouting) {
        existing.fromVisibleRouting = true;
      }
      return;
    }

    questionMap.set(normalized, {
      question: question.trim(),
      providers: new Set(
        options?.providerLabel ? [options.providerLabel] : [],
      ),
      fromVisibleRouting: Boolean(options?.fromVisibleRouting),
      order,
    });
    order += 1;
  };

  for (const question of routing.suggestedFirstQuestions ?? []) {
    addQuestion(question, { fromVisibleRouting: true });
  }

  for (const provider of routing.providers) {
    const providerLabel = getProviderLabel(provider.provider);
    for (const question of provider.suggestedFirstQuestions ?? []) {
      addQuestion(question, { providerLabel });
    }
  }

  return [...questionMap.values()]
    .sort((left, right) => {
      if (left.fromVisibleRouting !== right.fromVisibleRouting) {
        return left.fromVisibleRouting ? -1 : 1;
      }

      if (left.providers.size !== right.providers.size) {
        return right.providers.size - left.providers.size;
      }

      return left.order - right.order;
    })
    .slice(0, limit)
    .map((item) => {
      const providerLabels = [...item.providers];

      let provenanceLabel = "Visible routing record";
      if (providerLabels.length >= 2) {
        provenanceLabel = "Both routing AIs";
      } else if (providerLabels.length === 1) {
        provenanceLabel = `${providerLabels[0]} only`;
      }

      return {
        question: item.question,
        provenanceLabel,
      };
    });
}
