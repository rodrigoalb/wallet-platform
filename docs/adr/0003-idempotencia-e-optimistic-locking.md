# 0003: Idempotency-Key e optimistic locking

**Status:** aceita

## Contexto

Dois riscos clássicos em carteiras: (1) o cliente repete uma requisição após um timeout e o depósito acontece duas vezes; (2) duas operações simultâneas na mesma carteira leem o mesmo saldo e uma sobrescreve a outra (lost update).

## Decisão

- Depósitos e saques exigem o header `Idempotency-Key`. A chave é gravada no lançamento com `UNIQUE (wallet_id, idempotency_key)`.
  - Mesma chave e mesmo conteúdo: devolve o lançamento original, com `Idempotent-Replayed: true`, sem novos eventos.
  - Mesma chave e conteúdo diferente: `422 IDEMPOTENCY_KEY_REUSED`, porque quase sempre é bug no cliente.
- A carteira tem coluna `version` (recurso nativo do MikroORM). O `UPDATE` inclui `WHERE version = ?`; se nenhuma linha for afetada, a transação é desfeita.
- O caso de uso trata o conflito: se a causa foi outra requisição com a mesma chave, devolve o resultado dela; caso contrário, repete a operação até 3 vezes. Esgotadas as tentativas, responde `409 CONCURRENT_MODIFICATION`, e o cliente pode repetir com segurança usando a mesma chave.

## Alternativas consideradas

- **Lock pessimista** (`SELECT ... FOR UPDATE`): mais simples de raciocinar, mas segura a linha durante a transação e serializa todas as operações da carteira. Para conflitos raros, o otimista é mais leve.
- **Tabela separada de chaves de idempotência** com a resposta serializada: mais genérico (serve para qualquer endpoint), porém mais código. Aqui o próprio lançamento é a resposta.

## Consequências

- Retries do cliente são seguros. O teste e2e com 5 requisições simultâneas e a mesma chave gera um único lançamento.
- Sob concorrência alta na mesma carteira, parte das requisições pode receber 409 após 3 tentativas. O teste com 8 depósitos simultâneos confirma que nenhum valor se perde ou duplica.
- A chave tem escopo por carteira e não expira.
