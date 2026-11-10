#!/usr/bin/env bash
# Roteiro de demonstração automático (bash: Linux, macOS, WSL ou Git Bash no Windows).
# Pré-requisito: docker compose up -d --build --wait
set -euo pipefail

API=${API:-http://localhost:3000}
json() { node -pe "JSON.parse(require('fs').readFileSync(0, 'utf8'))$1"; }
step() { printf '\n\033[1m==> %s\033[0m\n' "$1"; }

step "1. Criar jogador"
PLAYER_ID=$(curl -sf -X POST "$API/players" -H 'Content-Type: application/json' \
  -d "{\"name\":\"Ana Demo\",\"email\":\"ana.$(date +%s)@example.com\"}" | json .id)
echo "PLAYER_ID=$PLAYER_ID"

step "2. Criar carteira"
WALLET_ID=$(curl -sf -X POST "$API/players/$PLAYER_ID/wallet" | json .id)
echo "WALLET_ID=$WALLET_ID"

echo
echo "Abra agora http://localhost:3001/?playerId=$PLAYER_ID e clique em Conectar."
read -r -p "Pressione Enter para continuar..." _ || true

step "3. Depositar R\$ 100,00"
curl -s -X POST "$API/wallets/$WALLET_ID/deposits" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-deposito-1' -H 'X-Correlation-Id: demo-deposito' \
  -d '{"amountCents":10000}'; echo

step "4. Repetir o MESMO depósito (mesma Idempotency-Key): não duplica"
curl -s -D - -o /dev/null -X POST "$API/wallets/$WALLET_ID/deposits" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-deposito-1' -d '{"amountCents":10000}' | grep -i idempotent-replayed

step "5. Sacar R\$ 25,50"
curl -s -X POST "$API/wallets/$WALLET_ID/withdrawals" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-saque-1' -d '{"amountCents":2550}'; echo

step "6. Saque maior que o saldo (422)"
curl -s -X POST "$API/wallets/$WALLET_ID/withdrawals" -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: demo-saque-2' -d '{"amountCents":999999}'; echo

step "7. Saldo e lançamentos"
curl -s "$API/wallets/$WALLET_ID"; echo
curl -s "$API/wallets/$WALLET_ID/transactions?limit=10"; echo

step "8. Pedir extrato (assíncrono)"
YEAR=$(date +%Y)
STATEMENT_ID=$(curl -sf -X POST "$API/wallets/$WALLET_ID/statements" -H 'Content-Type: application/json' \
  -d "{\"from\":\"$YEAR-01-01T00:00:00Z\",\"to\":\"$YEAR-12-31T23:59:59Z\"}" | json .id)
echo "STATEMENT_ID=$STATEMENT_ID"

step "9. Aguardar o statement-worker e baixar o CSV pela URL pré-assinada"
for _ in $(seq 1 20); do
  STATUS=$(curl -s "$API/statements/$STATEMENT_ID" | json .status)
  [ "$STATUS" = "READY" ] && break
  sleep 1
done
URL=$(curl -s "$API/statements/$STATEMENT_ID" | json .downloadUrl)
curl -s "$URL"

step "10. O mesmo correlationId nos logs de vários serviços"
docker compose logs wallet-service notification-service 2>/dev/null | grep demo-deposito | cut -c1-180 || true
