import { EventTypes } from '@app/common';
import { BusinessRuleError, InvalidArgumentError } from '../../shared/domain/errors';
import { Money } from './money';
import { TransactionType } from './transaction.entity';
import { Wallet } from './wallet.entity';

describe('Wallet', () => {
  let wallet: Wallet;

  beforeEach(() => {
    wallet = new Wallet('player-1');
  });

  it('depósito aumenta o saldo e gera um lançamento com o saldo após a operação', () => {
    const tx = wallet.deposit(Money.of(5000), 'key-1');

    expect(wallet.balance.amountCents).toBe(5000);
    expect(tx.type).toBe(TransactionType.DEPOSIT);
    expect(tx.amountCents).toBe(5000);
    expect(tx.balanceAfterCents).toBe(5000);
    expect(tx.walletId).toBe(wallet.id);
    expect(tx.idempotencyKey).toBe('key-1');
  });

  it('saque diminui o saldo', () => {
    wallet.deposit(Money.of(5000), 'key-1');
    const tx = wallet.withdraw(Money.of(1500), 'key-2');

    expect(wallet.balance.amountCents).toBe(3500);
    expect(tx.balanceAfterCents).toBe(3500);
  });

  it('saque pode zerar o saldo, mas não deixá-lo negativo', () => {
    wallet.deposit(Money.of(1000), 'key-1');
    expect(() => wallet.withdraw(Money.of(1001), 'key-2')).toThrow(BusinessRuleError);
    expect(wallet.balance.amountCents).toBe(1000);

    wallet.withdraw(Money.of(1000), 'key-3');
    expect(wallet.balance.isZero()).toBe(true);
  });

  it('recusa valor zero', () => {
    expect(() => wallet.deposit(Money.zero(), 'key-1')).toThrow(InvalidArgumentError);
    expect(() => wallet.withdraw(Money.zero(), 'key-1')).toThrow(InvalidArgumentError);
  });

  it('registra os eventos de domínio e os entrega uma única vez', () => {
    const tx = wallet.deposit(Money.of(700), 'key-1');

    const events = wallet.pullEvents();
    expect(events.map((e) => e.type)).toEqual([
      EventTypes.TransactionCreated,
      EventTypes.BalanceUpdated,
    ]);
    expect(events[1].payload).toEqual({
      walletId: wallet.id,
      playerId: 'player-1',
      balanceCents: 700,
      currency: 'BRL',
      transactionId: tx.id,
    });
    expect(wallet.pullEvents()).toEqual([]);
  });

  it('operação recusada não gera eventos', () => {
    expect(() => wallet.withdraw(Money.of(1), 'key-1')).toThrow();
    expect(wallet.pullEvents()).toEqual([]);
  });
});
