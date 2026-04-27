/**
 * @fileoverview Clase base para excepciones de negocio en el Anillo de Dominio.
 */
export class DomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'DOMAIN_ERROR') {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

/** Error para validaciones de esquemas o invariantes de negocio. */
export class DomainValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'DomainValidationError';
  }
}
