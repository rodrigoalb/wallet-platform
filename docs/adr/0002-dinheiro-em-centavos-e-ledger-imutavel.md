# 0002: Dinheiro em centavos inteiros e ledger imutável

**Status:** aceita

## Contexto

Valores monetários precisam ser exatos e toda movimentação precisa ser auditável. Em JavaScript, `number` é ponto flutuante binário: `0.1 + 0.2` resulta em `0.30000000000000004`.

## Decisão

- Todo valor é um inteiro em **centavos** dentro do value object `Money` (valor + moeda). `Money` recusa valores não inteiros, negativos ou acima de `Number.MAX_SAFE_INTEGER` e não permite operar moedas diferentes. A API também recebe e devolve centavos (`amountCents`).
- No PostgreSQL, colunas `bigint`.
- O saldo vive na carteira, mas toda mudança gera uma linha na tabela `transactions` com o valor e o **saldo após a operação**. Lançamentos nunca são alterados nem apagados: correções seriam um novo lançamento de estorno.
- A imutabilidade é reforçada no banco por um trigger que recusa `UPDATE` e `DELETE`, e o saldo por `CHECK (balance_cents >= 0)`.

## Consequências

- Sem erros de arredondamento; formatação para reais só acontece na borda (CSV e página web), com aritmética inteira.
- O ledger permite reconstruir e auditar qualquer saldo e gerar extratos com uma consulta simples.
- A tabela só cresce; em escala real seria preciso particionamento por data ou arquivamento.
- Guardar o saldo na carteira e também no ledger é redundância intencional: leitura rápida do saldo e histórico completo. As duas gravações acontecem na mesma transação.
