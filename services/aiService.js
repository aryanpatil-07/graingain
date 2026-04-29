import axios from "axios";

const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1";
const DEFAULT_MODEL = process.env.FEATHERLESS_MODEL || "gpt-4o-mini";

let discoveredModel = null;

function safeParse(text) {
  const sanitized = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(sanitized);
  } catch {
    return {
      food_type: "Unknown",
      expiry_hours: 2,
      urgency: "MEDIUM"
    };
  }
}

function inferFoodTypeFromDescription(description) {
  const lower = description.toLowerCase();

  if (lower.includes("pasta")) return "Pasta";
  if (lower.includes("rice")) return "Rice Meals";
  if (lower.includes("chicken")) return "Chicken Meals";
  if (lower.includes("biryani")) return "Biryani";
  if (lower.includes("dal")) return "Dal and Rice";
  if (lower.includes("veg") || lower.includes("vegetarian")) return "Vegetarian Meals";

  return "Prepared Meals";
}

function parseElapsedHours(description) {
  const match = description.toLowerCase().match(/(\d+(?:\.\d+)?)\s*hours?\s*old/);

  if (!match) {
    return 0;
  }

  const elapsedHours = Number.parseFloat(match[1]);

  return Number.isFinite(elapsedHours) ? Math.max(0, elapsedHours) : 0;
}

function deriveUrgency(remainingHours) {
  if (remainingHours <= 2) {
    return "HIGH";
  }

  if (remainingHours <= 4) {
    return "MEDIUM";
  }

  return "LOW";
}

function normalizeResult(description, parsed) {
  const rawFoodType = String(parsed.food_type || "").trim();
  const genericFoodType =
    rawFoodType.length === 0 ||
    /unknown|n\/a|not sure|unspecified/i.test(rawFoodType);

  const elapsedHours = parseElapsedHours(description);
  const providedExpiry = Number(parsed.expiry_hours);
  const fallbackExpiry = Number.isFinite(providedExpiry) ? providedExpiry : 2;
  const remainingSafeHours = Math.max(0, fallbackExpiry - elapsedHours);
  const urgency = deriveUrgency(remainingSafeHours);

  return {
    ...parsed,
    expiry_hours: remainingSafeHours,
    urgency,
    food_type: genericFoodType ? inferFoodTypeFromDescription(description) : rawFoodType
  };
}

async function listAvailableModels() {
  const response = await axios.get(`${FEATHERLESS_BASE_URL}/models`, {
    headers: {
      Authorization: `Bearer ${process.env.FEATHERLESS_API_KEY}`
    },
    timeout: 10000 // 10 second timeout
  });

  return Array.isArray(response.data?.data) ? response.data.data : [];
}

async function resolveWorkingModel(preferredModel) {
  if (discoveredModel) {
    return discoveredModel;
  }

  const models = await listAvailableModels();
  const modelIds = models.map((model) => model.id).filter(Boolean);

  if (modelIds.length === 0) {
    throw new Error("No models returned by Featherless API.");
  }

  if (modelIds.includes(preferredModel)) {
    discoveredModel = preferredModel;
    return discoveredModel;
  }

  const blockedTerms = [
    "embedding",
    "rerank",
    "vision",
    "whisper",
    "tts",
    "audio",
    "diffusion",
    "image"
  ];

  const scored = modelIds
    .filter((id) => !blockedTerms.some((term) => id.toLowerCase().includes(term)))
    .sort((a, b) => {
      const aScore = /instruct|chat/i.test(a) ? 2 : 0;
      const bScore = /instruct|chat/i.test(b) ? 2 : 0;
      return bScore - aScore;
    });

  discoveredModel = scored[0] || modelIds[0];
  return discoveredModel;
}

async function requestAnalysis(description, model) {
  const response = await axios.post(
    `${FEATHERLESS_BASE_URL}/chat/completions`,
    {
      model,
      temperature: 0,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: "You analyze food for donation systems."
        },
        {
          role: "user",
          content: `
Analyze this: ${description}

Consider time already passed.

Return JSON:

{
  "food_type": "",
  "expiry_hours": remaining safe time,
  "urgency": "LOW | MEDIUM | HIGH"
}
`
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.FEATHERLESS_API_KEY}`
      },
      timeout: 15000 // 15 second timeout for analysis
    }
  );

  const text = response.data?.choices?.[0]?.message?.content || "{}";
  const parsed = normalizeResult(description, safeParse(text));

  return {
    ...parsed,
    model_used: model,
    source: "ai"
  };
}

export async function analyzeFood(description) {
  const preferredModel = DEFAULT_MODEL;

  try {
    return await requestAnalysis(description, preferredModel);
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const code = axios.isAxiosError(err) ? err.response?.data?.error?.code : undefined;

    // If model is invalid, discover a valid one and retry once.
    if (status === 404 && code === "model_not_found") {
      try {
        const workingModel = await resolveWorkingModel(preferredModel);

        // Try the best candidate first, then try additional likely chat models.
        const models = await listAvailableModels();
        const modelIds = models.map((model) => model.id).filter(Boolean);
        const candidates = [
          workingModel,
          ...modelIds.filter((id) => /instruct|chat/i.test(id) && id !== workingModel)
        ].slice(0, 25);

        for (const candidateModel of candidates) {
          try {
            discoveredModel = candidateModel;
            return await requestAnalysis(description, candidateModel);
          } catch (candidateErr) {
            if (!axios.isAxiosError(candidateErr)) {
              continue;
            }

            const candidateStatus = candidateErr.response?.status;
            if (candidateStatus >= 500 || candidateStatus === 429) {
              continue;
            }
          }
        }

        // One final attempt with selected working model if loop did not return.
        return await requestAnalysis(description, workingModel);
      } catch (retryErr) {
        if (axios.isAxiosError(retryErr)) {
          console.error("AI RETRY ERROR:", {
            message: retryErr.message,
            status: retryErr.response?.status,
            data: retryErr.response?.data
          });
        } else {
          console.error("AI RETRY ERROR:", retryErr);
        }
      }
    }

    if (axios.isAxiosError(err)) {
      const data = err.response?.data;

      console.error("AI ERROR:", {
        message: err.message,
        status,
        data
      });
    } else {
      console.error("AI ERROR:", err);
    }

    return {
      food_type: "Vegetarian Meals",
      expiry_hours: 2,
      urgency: "HIGH",
      model_used: "fallback",
      source: "fallback"
    };
  }
}

export async function getImpactStory(foodItem) {
  return "A warm meal reaches someone who needed it today.";
}
