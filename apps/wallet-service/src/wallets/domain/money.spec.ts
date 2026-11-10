import { InvalidArgumentError } from '../../shared/domain/errors';
import { Money } from './money';

describe('Money', () => {
  it('soma e subtrai em centavos sem erro de ponto flutuante', () => {
    // Em float: 0.1 + 0.2 = 0.30000000000000004. Em centavos: 10 + 20 = 30.
    const total = Money.of(10).add(Money.of(20));
    expect(total.amountCents).toBe(30);
    expect(total.subtract(Money.of(5)).amountCents).toBe(25);
  });

  it('é imutável', () => {
    const original = Money.of(100);
    original.add(Money.of(50));
    expect(original.amountCents).toBe(100);
  });

  it.each([1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'recusa valor não inteiro: %p',
    (v) => {
      expect(() => Money.of(v)).toThrow(InvalidArgumentError);
    },
  );

  it('recusa valor negativo e subtração que ficaria negativa', () => {
    expect(() => Money.of(-1)).toThrow(InvalidArgumentError);
    expect(() => Money.of(10).subtract(Money.of(11))).toThrow(InvalidArgumentError);
  });

  it('recusa moeda não suportada', () => {
    expect(() => Money.of(100, 'USD')).toThrow('Moeda não suportada');
  });

  it('compara valores e formata para log', () => {
    expect(Money.of(100).isLessThan(Money.of(101))).toBe(true);
    expect(Money.of(100).equals(Money.of(100))).toBe(true);
    expect(Money.zero().isZero()).toBe(true);
    expect(Money.of(1050).toString()).toBe('BRL 10.50');
  });
});
