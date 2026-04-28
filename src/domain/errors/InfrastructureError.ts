/**
 * Error base para fallos controlados en adaptadores externos.
 * Permite que Application clasifique degradaciones sin acoplarse a implementaciones de Infrastructure.
 */
export class InfrastructureCommunicationError extends Error {
  public readonly code: string;

  constructor(message: string, code = "INFRASTRUCTURE_COMMUNICATION_ERROR") {
    super(message);
    this.name = "InfrastructureCommunicationError";
    this.code = code;
    Object.setPrototypeOf(this, InfrastructureCommunicationError.prototype);
  }
}

export class ProviderAuthenticationError extends InfrastructureCommunicationError {
  constructor(message: string) {
    super(message, "PROVIDER_AUTHENTICATION_ERROR");
    this.name = "ProviderAuthenticationError";
    Object.setPrototypeOf(this, ProviderAuthenticationError.prototype);
  }
}

export class ProviderCommunicationError extends InfrastructureCommunicationError {
  public readonly status: number;
  public readonly providerCode?: number;
  public readonly providerType?: string;
  public readonly retryable: boolean;

  constructor(input: {
    message: string;
    status: number;
    providerCode?: number;
    providerType?: string;
    retryable?: boolean;
  }) {
    super(input.message, "PROVIDER_COMMUNICATION_ERROR");
    this.name = "ProviderCommunicationError";
    this.status = input.status;
    this.providerCode = input.providerCode;
    this.providerType = input.providerType;
    this.retryable = input.retryable ?? input.status >= 500;
    Object.setPrototypeOf(this, ProviderCommunicationError.prototype);
  }
}
