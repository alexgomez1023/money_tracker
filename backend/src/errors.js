// Thrown by services and validators, turned into a JSON response by the error handler in index.js.
export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
