import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

import { handleMessage } from "./gemini.js";
import { logMessage } from "./messages.js";

const app = await Spectrum({
  projectId: process.env.SPECTRUM_PROJECT_ID,
  projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
  providers: [imessage.config()],
});

console.log("Listening for texts...");

for await (const [space, message] of app.messages) {
  if (message.content.type !== "text") continue;

  parseMessage(space, message);
}

async function parseMessage(space, message) {
  const phone = message.sender?.id;
  const text = message.content.text;

  console.log(`${phone}: ${text}`);
  try {
    await logMessage(phone, text, "inbound");
  } catch (error) {
    space.send("Unable to process your request.");
  }

  try {
    await space.responding(async () => {
      const { parsed, reply } = await handleMessage(text);
      console.log("Parsed:", parsed);
      console.log(`Gemini: ${reply}`);
      await space.send(reply);
      await logMessage(phone, reply, "outbound");
    });
  } catch (err) {
    console.error("Failed to reply:", err);
    await space
      .send("Sorry, something went wrong. Try again in a moment.")
      .catch(() => {});
  }
}
