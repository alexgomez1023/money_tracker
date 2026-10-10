import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { GoogleGenAI } from "@google/genai";

const app = await Spectrum({
  projectId: process.env.SPECTRUM_PROJECT_ID,
  projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
  providers: [imessage.config()],
});

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function askGemini(text) {
  const interaction = await gemini.interactions.create({
    model: "gemini-3.8-flash",
    system_instruction:
      "You are replying over iMessage. Answer in short plain text with no markdown.",
    input: text,
  });
  return interaction.output_text?.trim() || "Sorry, I didn't get a response.";
}

console.log("Listening for texts...");

for await (const [space, message] of app.messages) {
  if (message.content.type !== "text") continue;

  const text = message.content.text;
  console.log(`${message.sender?.id}: ${text}`);

  try {
    await space.responding(async () => {
      const reply = await askGemini(text);
      console.log(`Gemini: ${reply}`);
      await space.send(reply);
    });
  } catch (err) {
    console.error("Failed to reply:", err);
    await space.send("Sorry, something went wrong. Try again in a moment.").catch(() => {});
  }
}