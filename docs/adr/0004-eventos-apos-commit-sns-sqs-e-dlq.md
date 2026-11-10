# 0004: Eventos após o commit, fan-out SNS/SQS e DLQ

**Status:** aceita (com evolução planejada para outbox)

## Contexto

Outros serviços precisam reagir às movimentações (notificar o jogador, gerar extratos) sem que o wallet-service dependa deles ou espere por eles.

## Decisão

- O agregado registra eventos de domínio; o caso de uso os publica **somente depois do commit** da transação.
- Publicação num tópico **SNS** (`wallet-events`), com o atributo `eventType`. Cada consumidor tem sua fila **SQS** assinada ao tópico, com `FilterPolicy` por tipo e `RawMessageDelivery` (a fila recebe o JSON do evento sem o envelope do SNS).
- Todo evento leva `eventId` (para deduplicação) e `correlationId` (para rastreio).
- Cada fila tem uma **DLQ** com `maxReceiveCount = 3`.
- Consumidores fazem long polling (20 s), apagam a mensagem só após processar com sucesso e são idempotentes.

## Alternativas consideradas

- **Publicar antes do commit:** risco de anunciar algo que não aconteceu. Descartado.
- **Outbox transacional:** grava o evento na mesma transação e um processo separado publica. É a solução correta para não perder eventos e é o próximo passo; ficou fora para manter o projeto pequeno.
- **Só SQS, sem SNS:** o produtor teria que conhecer e enviar para cada fila.

## Consequências

- Se o SNS falhar logo após o commit, o evento se perde (o saldo continua correto e o erro vai para o log). Limitação documentada no README.
- Adicionar um consumidor novo é criar uma fila e uma assinatura, sem mudar o wallet-service.
- Mensagens problemáticas param na DLQ em vez de ficar em loop.
