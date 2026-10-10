import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

import { handleMessage } from "./message_orchestrator.js";
import { logMessage } from "./messages.js";

import { prisma } from "../db.js";

const id = process.env.SPECTRUM_PROJECT_ID;
const secret = process.env.SPECTRUM_PROJECT_SECRET;

let appPromise;

// One Spectrum connection for the whole process, opened the first time it's needed
function getApp() {
  if (!appPromise) {
    appPromise = Spectrum({
      projectId: process.env.SPECTRUM_PROJECT_ID,
      projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
      providers: [imessage.config()],
    });
  }

  return appPromise;
}

// Texts a phone number, starting the conversation if there isn't one yet
export async function sendText(phone, text) {
  let step = "getApp";

  try {
    const app = await getApp();

    console.log("sendText app ready:", Object.keys(app));

    step = "space.create";

    const space = await imessage(app).space.create(phone);

    console.log("sendText space created:", phone, space.id, space.type);

    step = "space.send";

    await space.send(text);

    console.log("sendText sent to:", phone);
  } catch (err) {
    console.error(`sendText failed at ${step}:`, err);

    throw err;
  }
}

export async function startListening() {
  const app = await getApp();

  console.log("Listening for texts...");

  for await (const [space, message] of app.messages) {
    if (message.content.type !== "text") continue;

    parseMessage(space, message);
  }
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
    const user = phone
      ? await prisma.user.findUnique({ where: { phone } })
      : null;

    if (!user) {
      await space.send(
        "Sign up and verify your phone number in the Money Tracker app to use this.",
      );

      return;
    }

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

export async function addPhotonUser(phone, firstName) {
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(
    `https://spectrum.photon.codes/projects/${id}/users/`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "shared", phoneNumber: phone, firstName }),
    },
  );

  const body = await res.json();
  if (!res.ok || !body.succeed)
    throw new Error(body.message ?? "Photon user create failed");

  return body.data.assignedPhoneNumber;
}
