import bcrypt from "bcrypt";

export async function generateHash(password) {
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  return passwordHash;
}

export async function checkHash(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}
