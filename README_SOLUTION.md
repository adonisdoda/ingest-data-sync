# DataSync Ingestion Solution

## Overview

This solution implements a high-throughput, production-ready data ingestion system that extracts 3 million events from the DataSync Analytics API and stores them in PostgreSQL. The system is fully containerized, resumable, and designed for optimal performance while respecting API rate limits.

## Architecture

### Folder Structure

The project follows a layered architecture pattern with clear separation of concerns:

```
packages/
├── ingestion.ts                 # Entry point - orchestrates the ingestion process
├── services/
│   ├── ingestion.service.ts     # Business logic layer - coordinates data flow
│   └── __tests__/
│       └── ingestion.service.test.ts
└── repository/
    ├── events.repository.ts      # API client - handles HTTP requests & retries
    ├── database.repository.ts    # Data persistence - PostgreSQL bulk operations
    └── __tests__/
        ├── events.repository.test.ts
        └── database.repository.test.ts
```

**Architecture Layers:**

1. **Entry Point (`ingestion.ts`)**: Initializes the application and triggers the ingestion process
2. **Service Layer (`services/`)**: Contains business logic and orchestration
   - Coordinates between API fetching and database insertion
   - Manages progress tracking and metrics
   - Handles state persistence for resumability
3. **Repository Layer (`repository/`)**: Handles external interactions
   - **Events Repository**: API communication, retry logic, pagination handling
   - **Database Repository**: PostgreSQL operations, bulk inserts, transaction management
4. **Tests (`__tests__/`)**: Unit tests for each layer ensuring reliability

### Key Technical Decisions

#### 1. Cursor-Based Pagination
After analyzing the API, I discovered it uses cursor-based pagination (not page-based):
- Each response includes `nextCursor` and `hasMore` fields
- Cursors have expiration time (`cursorExpiresIn`)
- Maximum limit per request: 5000 events
- This required switching from page-based to cursor-based implementation

#### 2. Retry Mechanism with Exponential Backoff
- 3 retry attempts for failed requests
- Handles rate limiting (429 status codes)
- Specific handling for rate limit responses

#### 3. Bulk Insert Optimization
- Batch size: 1000 records per transaction
- Uses PostgreSQL transactions (BEGIN/COMMIT/ROLLBACK)
- `ON CONFLICT DO NOTHING` for idempotency
- Connection pooling (max 20 connections)

#### 4. Progress Persistence
- Saves current cursor after each batch
- Tracks total events ingested
- Enables resumption after crashes or interruptions

#### 5. Sequential Processing
Initial parallel processing caused issues, so I implemented sequential cursor-based processing:
- Fetch → Insert → Save Progress → Repeat
- Respects `hasMore` flag to know when complete
- More reliable than parallel approach for cursor-based APIs

## AI Tools Usage

### GitHub Copilot (Claude Sonnet 4.5)
### Manus AI (Many Agents)

I extensively used **GitHub Copilot** throughout the development process, which significantly accelerated development:

#### 1. **Rapid Prototyping & Initial Setup**
- Generated boilerplate code for TypeScript project structure
- Created Docker Compose configuration with PostgreSQL setup
- Set up TypeScript configuration and build pipeline

#### 2. **API Discovery & Analysis**
- Helped analyze API response structures and pagination patterns
- Suggested testing different combinations of parameters (cursor, limit, page) and other headers
- Identified the cursor-based pagination pattern from response analysis
- Generated test scripts to explore API behavior

#### 3. **Testing**
- Generated unit test boilerplate for all modules
- Created mock implementations for repositories
- Suggested edge cases to test

#### 4. **Code Refactoring**
- Converted hardcoded values to environment variables
- Improved code organization and separation of concerns
- Added proper TypeScript types throughout
- Enhanced error messages and logging


**How I Used AI Effectively:**
1. **Clear context**: Always provided full file context and error messages
2. **Iterative refinement**: Used AI suggestions as starting points, then refined
3. **Validation**: Tested all AI-generated code before committing

## Running the Solution

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Git

### Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your API key:
```env
API_KEY=your_api_key_here
API_BASE_URL=http://datasync-dev-alb-101078500.us-east-1.elb.amazonaws.com/api/v1
DB_HOST=localhost
DB_PORT=5434
DB_NAME=data_sync
DB_USER=postgres
DB_PASSWORD=postgres
GITHUB_REPO=https://github.com/your-username/your-repo
```

### Running with Docker (Production)

**Start the ingestion:**
```bash
sh run-ingestion.sh
```

This script will:
1. Start PostgreSQL and the ingestion service
2. Monitor progress in real-time
3. Show throughput metrics (events/second)
4. Display total events ingested

The ingestion will continue until all 3 million events are stored.

### Running Locally (Development)

**Start PostgreSQL:**
```bash
docker compose up -d postgres
```

**Install dependencies:**
```bash
npm install
```

**Run ingestion:**
```bash
npm run dev
```

**Run tests:**
```bash
npm test
```


## Database Schema

```sql
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  properties JSONB,
  session JSONB,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
```

## Testing

Run unit tests:
```bash
npm test
```


**Testing Approach**:
- Mock external dependencies (API, database)
- Test error scenarios (timeouts, rate limits, connection failures)
- Verify retry mechanisms
- Validate progress persistence


---

## Repository

GitHub: [https://github.com/adonisdoda/ingest-data-sync](https://github.com/adonisdoda/ingest-data-sync)
