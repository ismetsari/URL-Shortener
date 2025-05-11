# URL Shortener Service

A high-performance URL shortener service that uses Redis for caching and PostgreSQL for permanent storage.

## Features

- Create shortened URLs with optional expiration dates
- Redis caching for fast URL lookups
- PostgreSQL for persistent storage
- Click tracking and analytics
- Batch processing of click counts for performance optimization

## Tech Stack

- Node.js with Express
- Redis for caching and rate limiting
- PostgreSQL for persistent storage
- Nanoid for generating short codes

## Architecture

The application follows a layered architecture:

1. **API Layer**: Express routes handling HTTP requests
2. **Service Layer**: Controllers implementing business logic
3. **Data Layer**: PostgreSQL for persistent storage, Redis for caching
4. **Utility Layer**: Helper functions for URL validation and code generation

### Cache Strategy

The application uses a cache-aside (lazy loading) strategy:
- URLs are cached in Redis on creation
- Lookups check Redis first, then PostgreSQL if not found
- Successful database lookups update the Redis cache
- Click counts are batched in Redis and periodically flushed to PostgreSQL

## Getting Started

### Prerequisites

- Git 
- Terraform 
- Minikube
- Jenkins
- Helm
- Kubectl
- Docker
- curl(testing purposes)
- Programming Language

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Edit `.env` with your configuration

4. Run database migrations:
   ```
   npm run migrate
   ```

5. Start the server:
   ```
   npm start
   ```
   Or for development:
   ```
   npm run dev
   ```

## How to Test Application
To shorten a URL, send a POST request to /api/urls endpoint:
Using curl:
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com/long-url-to-shorten"}'
Using Postman or any API client:
Set method to POST
Set URL to http://localhost:3000/api/urls
Add header: Content-Type: application/json
Set request body (JSON)

{
  "originalUrl": "https://example.com/long-url-to-shorten",
  "expiresAt": "2023-12-31T23:59:59Z" // optional
}

## Future Works
Redis caching strategy:
Current implementation assumes single Redis instance
Might need adjustment for Redis Sentinel or cluster deployments
High availability considerations:
The app can horizontally scale (it's stateless)
Database connections have pooling but may need tuning for your scale

## API Endpoints

### Create a short URL
```
POST /api/urls
```
Request body:
```json
{
  "originalUrl": "https://example.com/long-url-to-shorten",
  "expiresAt": "2023-12-31T23:59:59Z" // optional
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "originalUrl": "https://example.com/long-url-to-shorten",
    "shortUrl": "http://localhost:3000/abc123",
    "shortCode": "abc123",
    "createdAt": "2023-06-15T12:30:45Z",
    "expiresAt": "2023-12-31T23:59:59Z"
  }
}
```

### Redirect to original URL
```
GET /:shortCode
```

### Get URL statistics
```
GET /api/urls/:shortCode/stats
```

Response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "originalUrl": "https://example.com/long-url-to-shorten",
    "shortUrl": "http://localhost:3000/abc123",
    "shortCode": "abc123",
    "createdAt": "2023-06-15T12:30:45Z",
    "expiresAt": "2023-12-31T23:59:59Z",
    "clickCount": 42,
    "totalClicks": 42
  }
}
```

## Docker Setup

A `docker-compose.yml` file is provided to run the application with Redis and PostgreSQL:

```bash
docker-compose up
```

## Performance Optimizations

1. **Redis Caching**: Reduces database load for popular URLs
2. **Batch Click Processing**: Accumulates click counts in Redis and periodically flushes to PostgreSQL
3. **Connection Pooling**: Optimizes database connections
4. **Asynchronous Analytics**: Records click data without blocking the response

## License

MIT 