import { HttpError } from "../errors.js";

import { asObject, checkEmail, checkName, finish } from "./Auth.js";

// Only the fields present in the body are changed. Sending email as null or "" clears it.
export function validateUpdateUser(body) {
  const input = asObject(body);
  const errors = {};
  const data = {};

  if (input.name !== undefined) {
    data.name = checkName(input.name, errors);
  }

  if (input.email !== undefined) {
    data.email = checkEmail(input.email, errors);
  }

  if (input.name === undefined && input.email === undefined) {
    throw new HttpError(400, "Provide a name or email to update");
  }

  return finish(data, errors);
}
