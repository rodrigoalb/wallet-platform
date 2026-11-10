import { Statement } from './statement.entity';

export interface StatementRepository {
  findById(id: string): Promise<Statement | null>;
  save(statement: Statement): Promise<void>;
}

export const STATEMENT_REPOSITORY = Symbol('STATEMENT_REPOSITORY');
