FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY packages/ ./packages/

# Build TypeScript
RUN npm run build

# Run the application
CMD ["node", "dist/packages/ingestion.js"]
