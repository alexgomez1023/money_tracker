import { parseMessage, askGemini } from "./gemini.js";
import { returnOffers } from "./Offers.js";
import { EMPTY_PARSE } from "./gemini.js";

export async function handleMessage(text) {
  let parsed = EMPTY_PARSE;
  let reply = "";

  try {
    parsed = await parseMessage(text);
  } catch (err) {
    // Still reply if parsing fails
    console.error("Failed to parse message:", err);
  }

  if (!parsed || parsed.name === null || parsed.name === "") {
    reply = await askGemini(text, parsed, []);

    return { parsed, reply };
  }

  const offers = await returnOffers(parsed.name, parsed.product, parsed.price);

  if (!offers || offers.length === 0) {
    reply = "Sorry, I was unable to generate any offers.";
    return { parsed, reply };
  }

  reply = await askGemini(text, parsed, offers);

  return { parsed, reply };
}
