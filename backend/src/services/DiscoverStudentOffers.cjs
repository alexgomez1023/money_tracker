
const { GoogleGenAI } = require("@google/genai");

async function discoverStudentOffers(merchants = []) {
  const options = {
    vertexai: true,
    project: process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT,
    location:
      process.env.GCP_LOCATION || process.env.GOOGLE_CLOUD_LOCATION || "global",
  };

  if (process.env.GCP_KEY) {
    options.googleAuthOptions = {
      credentials: JSON.parse(process.env.GCP_KEY),
    };
  }

  const ai = new GoogleGenAI(options);

  const prompt = `
Find current student discounts available in the United States.

Prioritize these merchants:
${merchants.slice(0, 5).join(", ")}

Use Google Search to find student offers.
Prefer official merchant websites and student discount platforms.

Return up to 5 discounts as a JSON array containing:
name, offer, description, url, eligibility, reason.

Only include offers supported by search results.
Do not invent discount amounts or URLs.
Exclude international-only promotions.
Return only JSON.
`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    // Check whether Gemini used Google Search
    console.log(
      "[Web Discovery] Grounding metadata:",
      JSON.stringify(
        response.candidates?.[0]?.groundingMetadata ?? null,
        null,
        2
      )
    );

    // Extract JSON from Gemini's response
    const raw = (response.text || "")
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const offers = JSON.parse(raw);

    return {
      offers: Array.isArray(offers) ? offers : [],
      sources:
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
  } catch (error) {
    console.error("[DiscoverStudentOffers]", error);

    return {
      offers: [],
      sources: [],
      error: error.message,
    };
  }
}

module.exports = { discoverStudentOffers };
