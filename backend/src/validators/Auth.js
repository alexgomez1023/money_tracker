import { HttpError } from "../errors.js";

const NAME_MAX = 100;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
// bcrypt only hashes the first 72 bytes
const PASSWORD_MAX_BYTES = 72;
const PHONE_CODE_LENGTH = 6;

// E.164: "+", country code, 8 to 15 digits total
const PHONE_MIN_DIGITS = 8;
const PHONE_MAX_DIGITS = 15;
const PHONE_SEPARATORS = [" ", "(", ")", "-", "."];
const WHITESPACE = [" ", "\t", "\n", "\r"];

function isDigits(value) {
  for (const char of value) {
    if (char < "0" || char > "9") {
      return false;
    }
  }

  return value.length > 0;
}

// Allow "+1 (555) 123-4567" style input, return "+15551234567"
function stripPhoneSeparators(value) {
  let phone = "";
  for (const char of value) {
    if (!PHONE_SEPARATORS.includes(char)) {
      phone += char;
    }
  }

  return phone;
}

function isValidPhone(phone) {
  if (!phone.startsWith("+")) {
    return false;
  }

  const digits = phone.slice(1);

  return (
    isDigits(digits) &&
    digits[0] !== "0" &&
    digits.length >= PHONE_MIN_DIGITS &&
    digits.length <= PHONE_MAX_DIGITS
  );
}

function isValidEmail(email) {
  if (email.length > EMAIL_MAX) {
    return false;
  }

  for (const char of email) {
    if (WHITESPACE.includes(char)) {
      return false;
    }
  }

  // Exactly one "@" with something on both sides
  const parts = email.split("@");
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;
  if (local === "" || domain === "") {
    return false;
  }

  const dot = domain.lastIndexOf(".");

  return dot > 0 && dot < domain.length - 1;
}

export function checkName(value, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.name = "Name is required";
    return;
  }

  const name = value.trim();
  if (name.length > NAME_MAX) {
    errors.name = `Name must be at most ${NAME_MAX} characters`;
    return;
  }

  return name;
}

function checkPhone(value, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.phone = "Phone number is required";
    return;
  }

  const phone = stripPhoneSeparators(value.trim());
  if (!isValidPhone(phone)) {
    errors.phone =
      "Phone number must include the country code, e.g. +15551234567";
    return;
  }

  return phone;
}

export function checkEmail(value, errors) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    errors.email = "Email must be a valid email address";
    return;
  }

  const email = value.trim().toLowerCase();
  if (!isValidEmail(email)) {
    errors.email = "Email must be a valid email address";
    return;
  }

  return email;
}

function checkNewPassword(value, errors) {
  if (typeof value !== "string" || value === "") {
    errors.password = "Password is required";
    return;
  }

  if (value.length < PASSWORD_MIN) {
    errors.password = `Password must be at least ${PASSWORD_MIN} characters`;
    return;
  }

  if (Buffer.byteLength(value, "utf8") > PASSWORD_MAX_BYTES) {
    errors.password = `Password must be at most ${PASSWORD_MAX_BYTES} bytes`;
    return;
  }

  return value;
}

function checkRequiredString(value, field, label, errors) {
  if (typeof value !== "string" || value === "") {
    errors[field] = `${label} is required`;
    return;
  }

  return value;
}

export function finish(data, errors) {
  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Validation failed", errors);
  }

  return data;
}

export function asObject(body) {
  return body !== null && typeof body === "object" && !Array.isArray(body)
    ? body
    : {};
}

export function validateSignup(body) {
  const input = asObject(body);
  const errors = {};

  const data = {
    name: checkName(input.name, errors),
    phone: checkPhone(input.phone, errors),
    email: checkEmail(input.email, errors),
    password: checkNewPassword(input.password, errors),
  };

  return finish(data, errors);
}

export function validateLogin(body) {
  const input = asObject(body);
  const errors = {};

  const data = {
    phone: checkPhone(input.phone, errors),
    // No length rules here, a wrong password just fails the login
    password: checkRequiredString(
      input.password,
      "password",
      "Password",
      errors,
    ),
  };

  return finish(data, errors);
}

export function validateRefreshToken(body) {
  const input = asObject(body);
  const errors = {};

  const data = {
    refreshToken: checkRequiredString(
      input.refreshToken,
      "refreshToken",
      "Refresh token",
      errors,
    ),
  };

  return finish(data, errors);
}

export function validatePhoneCode(body) {
  const input = asObject(body);
  const errors = {};

  const code = typeof input.code === "string" ? input.code.trim() : "";
  if (code.length !== PHONE_CODE_LENGTH || !isDigits(code)) {
    errors.code = `Code must be ${PHONE_CODE_LENGTH} digits`;
  }

  return finish({ code }, errors);
}
