import { GoogleGenAI } from "@google/genai";

export const EMPTY_PARSE = { name: null, product: null, price: null };

const MODEL = "gemini-3.8-flash";

const gemini = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || "global",
});

const PARSE_SCHEMA = {
  type: "object",
  properties: {
    name: {
      type: ["string", "null"],
      description: "Company, store or brand the text is about",
    },
    product: {
      type: ["string", "null"],
      description: "Product or service the text is about",
    },
    price: {
      type: ["number", "null"],
      description: "Price as a plain number with no currency symbol",
    },
  },
  required: ["name", "product", "price"],
};

function cleanString(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function cleanPrice(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return value;
}

// Parser agent: pulls the company, product and price out of a text. Anything not mentioned is null.
export async function parseMessage(text) {
  const interaction = await gemini.interactions.create({
    model: MODEL,
    system_instruction:
      "Extract details from a text message a user sent about something they want to buy or did buy. " +
      "name is the company, store or brand. product is the product or service. price is the amount as a number. " +
      "Use null for anything the text does not mention. Do not guess.",
    input: text,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: PARSE_SCHEMA,
    },
  });

  const parsed = JSON.parse(interaction.output_text);

  return {
    name: cleanString(parsed.name),
    product: cleanString(parsed.product),
    price: cleanPrice(parsed.price),
  };
}

// Reply agent: writes the text sent back to the user, using what the parser found
export async function askGemini(text, parsed = EMPTY_PARSE, offers) {
  const interaction = await gemini.interactions.create({
    model: MODEL,
    system_instruction:
      "You are replying over iMessage. Answer in short plain text with no markdown. " +
      `Offer details already extracted from the user's text: ${JSON.stringify(offers)}. If the offer doesn't explicitly tell the user where to find the offer, tell them to go to the Offer's name's website and find it there. If the JSON is empty, then responsd to this text: ${text}`,
    input: text,
  });

  return interaction.output_text?.trim() || "Sorry, I didn't get a response.";
}
