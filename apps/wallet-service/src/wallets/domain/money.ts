import { InvalidArgumentError } from '../../shared/domain/errors';

/** Hoje só existe BRL; a lista deixa explícito onde adicionar outras moedas. */
export const SUPPORTED_CURRENCIES: readonly string[] = ['BRL'];

/**
 * Value object de dinheiro: valor inteiro em centavos mais a moeda.
 * Nunca usamos float porque 0.1 + 0.2 !== 0.3 em ponto flutuante binário.
 * É imutável: add e subtract devolvem uma nova instância.
 */
export class Money {
  private constructor(
    readonly amountCents: number,
    readonly currency: string,
  ) {}

  static of(amountCents: number, currency: string = 'BRL'): Money {
    if (!Number.isSafeInteger(amountCents)) {
      throw new InvalidArgumentError(
        'INVALID_AMOUNT',
        `O valor deve ser um inteiro em centavos, recebido: ${amountCents}`,
      );
    }
    if (amountCents < 0) {
      throw new InvalidArgumentError('INVALID_AMOUNT', 'O valor não pode ser negativo');
    }
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      throw new InvalidArgumentError('UNSUPPORTED_CURRENCY', `Moeda não suportada: ${currency}`);
    }
    return new Money(amountCents, currency);
  }

  static zero(currency: string = 'BRL'): Money {
    return Money.of(0, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amountCents + other.amountCents, this.currency);
  }

  /** Lança erro se o resultado for negativo; quem chama deve verificar antes. */
  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amountCents - other.amountCents, this.currency);
  }

  isZero(): boolean {
    return this.amountCents === 0;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amountCents < other.amountCents;
  }

  equals(other: Money): boolean {
    return this.amountCents === other.amountCents && this.currency === other.currency;
  }

  /** Apenas para logs e mensagens, ex.: "BRL 10.50". */
  toString(): string {
    const reais = Math.trunc(this.amountCents / 100);
    const cents = String(this.amountCents % 100).padStart(2, '0');
    return `${this.currency} ${reais}.${cents}`;
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new InvalidArgumentError(
        'CURRENCY_MISMATCH',
        `Não é possível operar ${this.currency} com ${other.currency}`,
      );
    }
  }
}
