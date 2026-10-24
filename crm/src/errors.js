// Errors carry a `code` the frontend reacts to (AUTH signs the user out, FORBIDDEN shows "no access", ...).
export class ApiError extends Error {
  constructor(message, code = 'ERR') {
    super(message);
    this.code = code;
  }
}
export const fail = (message, code) => { throw new ApiError(message, code); };
