/**
 * Erros de domínio e de aplicação. Eles não conhecem HTTP: quem traduz
 * cada categoria para um status code é o filtro global de exceções
 * (shared/http/all-exceptions.filter.ts).
 */
export abstract class DomainError extends Error {
  constructor(
    /** Código estável, legível por máquina (ex.: INSUFFICIENT_FUNDS). */
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** Dado de entrada inválido segundo uma regra de domínio (400). */
export class InvalidArgumentError extends DomainError {}

/** Recurso inexistente (404). */
export class NotFoundError extends DomainError {}

/** Conflito com o estado atual, como e-mail já cadastrado (409). */
export class ConflictError extends DomainError {}

/** Regra de negócio violada, como saldo insuficiente (422). */
export class BusinessRuleError extends DomainError {}

/**
 * Duas operações tentaram alterar o mesmo dado ao mesmo tempo (optimistic lock
 * ou violação de unicidade). É seguro repetir a operação.
 */
export class ConcurrencyConflictError extends ConflictError {
  constructor(message = 'O recurso foi alterado por outra operação. Tente novamente.') {
    super('CONCURRENT_MODIFICATION', message);
  }
}
