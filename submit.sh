echo "=============================================="
echo "Submitting to DataSync API..."
echo "=============================================="

RESPONSE=$(curl -X POST \
  -H "X-API-Key: ds_be6f40b6af0443561eb641a1dc37338d" \
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