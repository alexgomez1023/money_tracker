import { parseMessage, askGemini } from "./gemini.js";
import { returnOffers } from "./Offers.js";

const EMPTY_PARSE = { name: null, product: null, price: null };

export async function handleMessage() {
  let parsed = EMPTY_PARSE;

  try {
    parsed = await parseMessage(text);
  } catch (err) {
    // Still reply if parsing fails
    console.error("Failed to parse message:", err);
  }

  const offers = await returnOffers(parsed.name, parsed.product, parsed.price);

  const reply = await askGemini(text, offers);

  return { parsed, reply };
}
