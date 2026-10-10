import { prisma } from "../db.js";
import { HttpError } from "../errors.js";

// Prisma's error code for updating or deleting a row that isn't there
const RECORD_NOT_FOUND_ERROR = "P2025";

// Only these columns are read, so passwordHash never leaves the database
const PUBLIC_USER_FIELDS = {
  id: true,
  name: true,
  phone: true,
  email: true,
  agentOptOut: true,
  createdAt: true,
};

export async function getUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_FIELDS,
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return user;
}

// Only name and email can be changed. A field left undefined is not touched.
export async function updateUser(userId, { name, email }) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: PUBLIC_USER_FIELDS,
    });
  } catch (err) {
    if (err.code === RECORD_NOT_FOUND_ERROR) {
      throw new HttpError(404, "User not found");
    }

    throw err;
  }
}

// Sessions, messages and the Photon line are removed with the user (onDelete: Cascade)
export async function deleteUser(userId) {
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (err) {
    if (err.code === RECORD_NOT_FOUND_ERROR) {
      throw new HttpError(404, "User not found");
    }

    throw err;
  }
}
