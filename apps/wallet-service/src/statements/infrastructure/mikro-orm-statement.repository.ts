import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Statement } from '../domain/statement.entity';
import { StatementRepository } from '../domain/statement.repository';

@Injectable()
export class MikroOrmStatementRepository implements StatementRepository {
  constructor(private readonly em: EntityManager) {}

  findById(id: string): Promise<Statement | null> {
    return this.em.findOne(Statement, { id });
  }

  async save(statement: Statement): Promise<void> {
    await this.em.persist(statement).flush();
  }
}
