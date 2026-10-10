import { prisma } from "../db.js";

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
