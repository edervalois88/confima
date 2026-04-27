/**
 * @fileoverview Entidad Pura del Perfil del Cliente.
 * Anillo 1: Domain.
 */

export interface CustomerProfileProps {
  id: string;
  phoneFingerprint: string;
  vipReliabilityScore: number;
}

export class CustomerProfile {
  private constructor(private readonly props: CustomerProfileProps) {}

  public static create(props: CustomerProfileProps): CustomerProfile {
    return new CustomerProfile(props);
  }

  public get id() { return this.props.id; }
  public get phoneFingerprint() { return this.props.phoneFingerprint; }
  public get vipReliabilityScore() { return this.props.vipReliabilityScore; }
}
