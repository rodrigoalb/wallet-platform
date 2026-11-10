# Uso de IA neste projeto

Este documento descreve, com transparência, como ferramentas de IA agêntica foram usadas para construir o projeto, o que eu revisei, o que precisou ser corrigido e como validei o resultado.

## Ferramenta e forma de trabalho

- **Ferramenta:** Claude Code (agente de programação da Anthropic), rodando no terminal com acesso ao repositório, ao Node.js e ao Docker.
- **Ponto de partida:** escrevi um briefing com o domínio, a arquitetura, os endpoints, os requisitos de infraestrutura e a ordem de construção em seis fases.
- **Ciclo de cada fase:** o agente implementava, rodava compilação, lint e testes, corrigia o que falhava e só então fazia o commit. O histórico do Git mostra uma fase por commit.
- **Regra combinada:** se algo não pudesse ser verificado no ambiente, isso deveria ser dito explicitamente.

## O que a IA fez

- Estrutura do monorepo NestJS, configuração de TypeScript estrito, ESLint, Prettier e Jest.
- Código dos três serviços e da biblioteca comum, migrações, Dockerfiles, docker-compose, script do LocalStack e workflow de CI.
- Testes unitários e e2e.
- Primeira versão do README, dos ADRs e deste arquivo.

## Decisões e correções que surgiram durante o desenvolvimento

Situações reais desta construção em que a primeira opção não servia ou um problema foi detectado e corrigido:

1. **Versões das bibliotecas.** As versões mais recentes do MikroORM (7.x) exigem Node 22.17+, e o ambiente tinha Node 20. Foram escolhidas versões estáveis e bem documentadas (NestJS 11, MikroORM 6, TypeScript 5.9). As imagens Docker e o CI usam Node 22.
2. **LocalStack exigindo conta.** A imagem `latest` do LocalStack parou de iniciar sem token. O agente testou tags anteriores, confirmou que a 4.12 roda sem cadastro e fixou essa versão (ver [ADR 0005](docs/adr/0005-localstack-fixado-e-secrets-manager.md)).
3. **Webpack e descoberta de arquivos.** Como o build empacota cada serviço num único arquivo, entidades e migrações são listadas explicitamente em vez de descobertas por padrão de nome de arquivo.
4. **Construtor não executado pelo ORM.** O MikroORM cria entidades carregadas do banco sem chamar o construtor, então a lista de eventos pendentes da carteira poderia ficar indefinida. Foi usada inicialização preguiçosa, com comentário explicando o motivo.
5. **Erros do ORM vazando para a aplicação.** O caso de uso de movimentação precisava reagir a conflitos de concorrência sem importar classes do MikroORM. O gerenciador de transação passou a traduzir esses erros para um `ConcurrencyConflictError` da aplicação.
6. **Erros de lint encontrados antes do commit.** Exemplos: uso inseguro de valores `any` em testes, template string com `URLSearchParams` e uma função `async` sem `await`. Num caso o commit da fase 4 saiu com um erro de lint; ele foi corrigido e o commit refeito antes de seguir.
7. **URL pré-assinada inacessível.** Dentro do Docker o S3 é `http://localstack:4566`, endereço que o navegador não conhece. Foi criado um cliente S3 separado, com o endpoint público `localhost`, só para assinar URLs.

## Como validei

- **Testes automatizados:** 46 testes unitários e 19 e2e contra PostgreSQL real, todos passando. Destaques:
  - um teste compara o esquema gerado pelas migrações com as entidades;
  - 8 depósitos simultâneos na mesma carteira: o saldo final é exatamente a soma dos aceitos;
  - 5 requisições simultâneas com a mesma `Idempotency-Key` geram um único lançamento;
  - `UPDATE` e `DELETE` manuais no ledger são recusados pelo banco;
  - gateway WebSocket testado com clientes socket.io reais (sem token é recusado; o evento chega só ao jogador certo).
- **Ambiente completo:** `docker compose down -v` seguido de `docker compose up -d --build --wait`, verificando os cinco containers saudáveis e o roteiro de demonstração (`scripts/demo.sh`) do início ao fim.
- **Fluxos assíncronos de verdade:** depósito com notificação chegando pelo WebSocket em cerca de 60 ms; extrato gerado no S3 e baixado pela URL pré-assinada; mensagem inválida indo para a DLQ após 3 tentativas; mesmo `correlationId` nos logs dos serviços envolvidos.
- **CI:** o primeiro push disparou o GitHub Actions e os três jobs passaram (lint e unitários, e2e com PostgreSQL e build das imagens). Um aviso sobre actions rodando em Node 20 levou à atualização de `actions/checkout` e `actions/setup-node` para a v7.
- **Segredos:** conferido que as variáveis de ambiente dos containers não contêm a senha do banco nem o segredo do JWT.

### O que não foi verificado pelo agente

- A página `public/index.html` não foi aberta num navegador pelo agente. O JavaScript dela passou na checagem de sintaxe, e o mesmo fluxo (pedir token, conectar, receber `balance.updated`) foi testado com um cliente socket.io em Node.
- O ambiente de desenvolvimento era Linux (WSL 2). A execução no Windows com Docker Desktop segue o mesmo caminho, mas não foi testada diretamente.

## Minhas observações

> Seções para eu completar com a minha própria revisão.

### O que eu revisei linha a linha

<!-- Ex.: o agregado Wallet, o caso de uso de movimentação, as migrações... -->

### O que eu mudei depois da geração

<!-- Ex.: nomes, mensagens, regras, testes adicionais... -->

### O que eu conferi na documentação oficial

<!-- Ex.: optimistic locking no MikroORM, RawMessageDelivery e FilterPolicy no SNS, presigned URLs no S3, middleware do socket.io... -->

### O que aprendi

<!-- Ex.: diferenças entre NestJS e Spring Boot, AsyncLocalStorage, fan-out SNS/SQS... -->

### Onde a IA errou ou eu discordei

<!-- Ex.: sugestões que descartei e por quê. -->
