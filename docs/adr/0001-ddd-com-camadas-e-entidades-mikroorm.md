# 0001: DDD com camadas por módulo e entidades MikroORM no domínio

**Status:** aceita

## Contexto

O projeto precisa mostrar regras de negócio claras (saldo nunca negativo, ledger imutável) e ser fácil de testar e explicar. Ao mesmo tempo é pequeno: abstrações demais atrapalhariam a leitura.

## Decisão

- Cada módulo (`players`, `wallets`, `statements`) tem quatro pastas: `domain`, `application`, `infrastructure` e `presentation`.
- O agregado `Wallet` é a única forma de alterar saldo; ele cria os lançamentos (`Transaction`) e registra os eventos de domínio.
- Repositórios, transação e publicador de eventos são **interfaces** (portas) definidas no domínio ou na aplicação. As implementações MikroORM e AWS ficam em `infrastructure` e são ligadas no módulo Nest por tokens de injeção.
- Agregados se referenciam por id (`Wallet.playerId`), não por objeto.
- **Concessão pragmática:** as entidades de domínio carregam os decorators do MikroORM (`@Entity`, `@Property`), como se faz com JPA. A alternativa seria um modelo de domínio puro e um mapeamento separado (`EntitySchema`), duplicando cada classe.

## Consequências

- Casos de uso são testados com repositórios em memória, sem banco e sem Nest.
- Trocar MikroORM por outro ORM exigiria mexer nas entidades (por causa dos decorators), mas não nos casos de uso.
- Como o MikroORM não chama o construtor ao carregar do banco, campos que não são persistidos (a lista de eventos pendentes) usam inicialização preguiçosa. Isso está comentado em `wallet.entity.ts`.
