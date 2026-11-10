#!/bin/bash
# Executado pelo LocalStack quando ele fica pronto (pasta /etc/localstack/init/ready.d).
# Cria toda a infraestrutura AWS usada pelo projeto. "awslocal" é o AWS CLI
# já apontado para o LocalStack.
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
ACCOUNT_ID="000000000000"   # conta fictícia padrão do LocalStack

echo "==> SNS: tópico de eventos da carteira"
TOPIC_ARN=$(awslocal sns create-topic --name wallet-events --query TopicArn --output text)

# Cria a fila principal e sua DLQ. Depois de 3 tentativas sem sucesso
# (maxReceiveCount), a mensagem vai para a DLQ em vez de ficar em loop.
create_queue_with_dlq() {
  local name="$1" visibility="$2"
  awslocal sqs create-queue --queue-name "${name}-dlq" \
    --attributes MessageRetentionPeriod=1209600 > /dev/null
  local dlq_arn="arn:aws:sqs:${REGION}:${ACCOUNT_ID}:${name}-dlq"
  awslocal sqs create-queue --queue-name "${name}" --attributes "{
    \"VisibilityTimeout\": \"${visibility}\",
    \"RedrivePolicy\": \"{\\\"deadLetterTargetArn\\\":\\\"${dlq_arn}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"
  }" > /dev/null
  echo "arn:aws:sqs:${REGION}:${ACCOUNT_ID}:${name}"
}

# Assina a fila no tópico. RawMessageDelivery entrega o JSON do evento sem o
# envelope do SNS, e o FilterPolicy faz cada fila receber só os tipos que usa.
subscribe() {
  local queue_arn="$1" filter="$2"
  awslocal sns subscribe --topic-arn "$TOPIC_ARN" --protocol sqs \
    --notification-endpoint "$queue_arn" \
    --attributes "{\"RawMessageDelivery\":\"true\",\"FilterPolicy\":\"${filter}\"}" > /dev/null
}

echo "==> SQS: filas e DLQs"
NOTIFICATIONS_ARN=$(create_queue_with_dlq notifications-queue 30)
STATEMENTS_ARN=$(create_queue_with_dlq statements-queue 60)

echo "==> SNS -> SQS: assinaturas com filtro por tipo de evento"
subscribe "$NOTIFICATIONS_ARN" '{\"eventType\":[\"wallet.balance-updated\"]}'
subscribe "$STATEMENTS_ARN" '{\"eventType\":[\"statement.requested\"]}'

echo "==> S3: bucket de extratos"
awslocal s3api create-bucket --bucket "${STATEMENTS_BUCKET:-wallet-statements}" > /dev/null

echo "==> Secrets Manager: credenciais do banco e segredo do JWT"
# A senha do banco vem do docker-compose (mesmo valor usado pelo container do Postgres).
# O segredo do JWT é gerado aleatoriamente a cada subida.
JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
awslocal secretsmanager create-secret --name wallet-platform/database \
  --secret-string "{\"username\":\"${DB_USER}\",\"password\":\"${DB_PASSWORD}\"}" > /dev/null
awslocal secretsmanager create-secret --name wallet-platform/jwt \
  --secret-string "{\"secret\":\"${JWT_SECRET}\"}" > /dev/null

echo "==> Infraestrutura AWS local pronta"
