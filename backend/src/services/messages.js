import { prisma } from "../db.js";
import { sendText } from "./photon.js";

// Saves a text to MessageLog. Texts from numbers without an account are skipped.
export async function logMessage(phone, text, direction = "inbound") {
  if (!phone) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({ where: { phone } });

    if (!user) {
      return null;
    }

    return await prisma.messageLog.create({
      data: { userId: user.id, direction, text },
    });
  } catch (err) {
    // A failed log shouldn't stop the reply from going out
    console.error("Failed to log message:", err);

    return null;
  }
}

export async function sendWelcomeMessage(name, phone) {
  sendText(
    phone,
    `Hi ${name}, welcome to money tracker! My name is TBD, and I am your personal finance assistant. Ask me any financial question about your account, or ask for any discounts for your favorite sites/stores!`,
  );
}
