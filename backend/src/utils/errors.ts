export class BusinessError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'BusinessError';
    this.status = status;
    Object.setPrototypeOf(this, BusinessError.prototype);
  }
}

export function notFound(message: string): BusinessError {
  return new BusinessError(message, 404);
}

export function forbidden(message: string): BusinessError {
  return new BusinessError(message, 403);
}
