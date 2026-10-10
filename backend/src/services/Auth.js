import { checkHash, generateHash } from "./Password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from "./Token.js";
import { sendWelcomeMessage } from "./messages.js";
import { prisma } from "../db.js";
import { HttpError } from "../errors.js";
import { addPhotonUser } from "./photon.js";

// Prisma's error code for a unique constraint failure
const UNIQUE_CONSTRAINT_ERROR = "P2002";

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function createSession(userId) {
  const refreshToken = generateRefreshToken();

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });

  return { accessToken: generateAccessToken(userId), refreshToken };
}

export async function signupUser({ name, phone, email, password }) {
  const passwordHash = await generateHash(password);

  let user;
  try {
    user = await prisma.user.create({
      data: { name, phone, email, passwordHash },
    });
  } catch (err) {
    if (err.code === UNIQUE_CONSTRAINT_ERROR) {
      throw new HttpError(
        409,
        "An account with this phone number already exists",
      );
    }
    throw err;
  }
  let phone_number;
  try {
    phone_number = await addPhotonUser(phone, name);
  } catch (err) {
    console.error("Photon setup failed:", phone);
    throw new HttpError(
      409,
      "Unable to setup messaging agent. Please try again.",
    );
  }

  const tokens = await createSession(user.id);

  return { user: toPublicUser(user), agentPhone: phone_number, ...tokens };
}

export async function loginUser({ phone, password }) {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || !(await checkHash(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid phone number or password");
  }

  const tokens = await createSession(user.id);

  return { user: toPublicUser(user), ...tokens };
}

export async function refreshToken({ refreshToken }) {
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hashRefreshToken(refreshToken) },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  return { accessToken: generateAccessToken(session.userId) };
}

export async function logoutUser({ refreshToken }) {
  await prisma.session.updateMany({
    where: {
      refreshTokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
