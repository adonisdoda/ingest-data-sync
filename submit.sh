#!/bin/bash
set -e

API_KEY="ds_086cfa60c0c2a3df470fe85084780c07"
GITHUB_REPO="https://github.com/adonisdoda/ingest-data-sync"

echo "=============================================="
echo "Extracting event IDs from database..."
echo "=============================================="

# Extrair todos os event IDs do banco de dados
docker exec assignment-postgres psql -U postgres -d postgres -t -c "SELECT id FROM events ORDER BY id;" > event_ids.txt

# Remover espaços em branco
sed -i 's/^[[:space:]]*//;s/[[:space:]]*$//' event_ids.txt

# Contar eventos
EVENT_COUNT=$(wc -l < event_ids.txt)

echo "Extracted $EVENT_COUNT event IDs"
echo ""
echo "=============================================="
echo "Submitting to DataSync API..."
echo "=============================================="

RESPONSE=$(curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: text/plain" \
  --data-binary @event_ids.txt \
  -w "\n%{http_code}" \
  "http://datasync-dev-alb-101078500.us-east-1.elb.amazonaws.com/api/v1/submissions?github_repo=$GITHUB_REPO")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"

echo ""
echo "=============================================="
echo "Submission complete!"
echo "=============================================="