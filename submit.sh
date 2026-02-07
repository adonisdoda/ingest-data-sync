#!/bin/bash
set -e

API_KEY="ds_be6f40b6af0443561eb641a1dc37338d"
GITHUB_REPO="https://github.com/yourusername/your-repo"  # UPDATE THIS

echo "=============================================="
echo "Extracting event IDs from database..."
echo "=============================================="

# Extract all event IDs from database
docker exec assignment-postgres psql -U postgres -d postgres -t -c "SELECT id FROM events ORDER BY id;" > event_ids.txt

# Remove whitespace
sed -i 's/^[[:space:]]*//;s/[[:space:]]*$//' event_ids.txt

# Count events
EVENT_COUNT=$(wc -l < event_ids.txt)

echo "Extracted $EVENT_COUNT event IDs"
echo ""
echo "=============================================="
echo "Submitting to DataSync API..."
echo "=============================================="

# Submit to API
curl -X POST \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: text/plain" \
  --data-binary @event_ids.txt \
  "http://datasync-dev-alb-101078500.us-east-1.elb.amazonaws.com/api/v1/submissions?github_repo=$GITHUB_REPO"

echo ""
echo "=============================================="
echo "Submission complete!"
echo "=============================================="
