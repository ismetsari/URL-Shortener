# URL Shortener

A high-performance URL shortener service that uses Redis for caching and PostgreSQL for permanent storage.

## Why Did I Choose This Project?

- Simple and functional
- Multiple endpoints
- Includes health check endpoint
- Good for showing DevOps practices
- Demonstrates basic web service concepts

## Prerequisites

- Git 
- Terraform 
- Minikube
- Jenkins
- Helm
- Kubectl
- Docker
- curl(testing purposes)
- Postgresql sudo apt-get install -y postgresql-client
- Redis-tools sudo apt install -y redis-tools

## Services
- **URL Shortener**: Creates 2 endpoints and generates random payloads.
- **Redis**: Stores the payloads.
- **PostgreSQL**: Stores the data.

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

### Installation

  1. Clone the repository
  2. Go to the scripts directory to install dependencies by using script:
   ```
   cd URL-Shortener/scripts
   ./setup-dev-tools.sh
   ```

  3. Go to Jenkins UI and configure the pipeline
  - If you did not specify any port for Jenkins, you can reach it from http://localhost:8080/
  - Click on "New Item" 
  - Name pipeline as url-shortener(this is important since the name is used in commands)
  - Select "Pipeline" as item type and click "OK"
  - In the opened "Configuration" page, copy Jenkinsfile and paste it to script part and click "Save"
  - Click the "Build Now" button for the url-shortener. The build will fail, but this step is necessary for Jenkins to create the workspace mentioned in the next step. You can also create directory manually but this is easier.

4. Move the repository to the Jenkins workspace. Jenkins crated a dedicated workspace for our project(mentioned in the previous step). To prevent potential permission issues, we will move the project to that workspace.
```bash
sudo mv ~/URL-Shortener /var/lib/jenkins/workspace/URL-Shortener
```
5. Ensure that the jenkins user is a member of the docker group. You can verify this by running the command **groups jenkins**. If the jenkins user is not a member, add it using the usermod command.
```bash
sudo usermod -aG docker jenkins
```

6. Navigate to the terraform directory to provision minikube cluster:
   ```
   cd URL-Shortener/terraform
   terraform init
   terraform apply
   ```
   If you run project first time you need to run terraform init otherwise terraform apply is enough.

7. Now run Jenkins pipeline the build and deployment process will be handled by pipeline.

## How to Test Application
To shorten a URL, send a POST request to /api/urls endpoint:

1) Using curl:
```bash
curl -X POST http://<minikube-ip>:30031/api/urls \ -H "Content-Type: application/json" \ -d '{"originalUrl": "https://example.com/long-url-to-shorten"}'
```
2) Using Postman or any API client:
- Set method to POST
- Set URL to http://<minikube-ip>:30031/api/urls
- Add header: Content-Type: application/json
- Set request body (JSON)
```json
{
  "originalUrl": "https://example.com/long-url-to-shorten",
  "expiresAt": "2023-12-31T23:59:59Z" // optional
}
```
expected output will be like:
```json
{
    "status": "success",
    "data": {
        "id": 26,
        "originalUrl": "https://example-url.com",
        "shortUrl": "http://<minikube-ip>:30031/6Ez2GxE",
        "shortCode": "6Ez2GxE",
        "createdAt": "2025-05-12T17:07:44.973Z",
        "expiresAt": "2023-12-31T23:59:59Z"
    }
```
3) Testing with scripts

  - Navigate to the scripts directory and run test scripts
```bash
  cd URL-Shortener/scripts
```

  - Run postgre script
```bash
  ./test_postgre.sh
```

  Expected output will be like below:

```json
  ismet@ubuntu:~/repository/URL-Shortener/scripts$ ./test_postgres.sh 
  Expanded display is on.
  -[ RECORD 1 ]+--------------------------------------------------------------------------------------------------
  id           | 1
  original_url | https://github.com/ismetsari?tab=repositories
  short_code   | fyoQaAK
  created_at   | 2025-05-11 23:50:46.522015+00
  expires_at   | 2023-12-31 23:59:59+00
  click_count  | 0
  -[ RECORD 2 ]+--------------------------------------------------------------------------------------------------
  id           | 2
  original_url | https://github.com/ismetsari
  short_code   | nH9dib7
  created_at   | 2025-05-11 23:51:09.718124+00
  expires_at   | 2023-12-31 23:59:59+00
  click_count  | 0
```

  - Run redis script
```bash
  ./test_redis.sh
```

  Expected output will be like below:
  1) "clicks:bEuVjR8"
  2) "clicks:1WzaHeO"
  3) "clicks:JscfaSG"
  4) "url:6Ez2GxE"
  5) "clicks:W8CKCxV"
  6) "clicks:_h86gz4"

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
## Performance Optimizations

1. **Redis Caching**: Reduces database load for popular URLs
2. **Batch Click Processing**: Accumulates click counts in Redis and periodically flushes to PostgreSQL
3. **Connection Pooling**: Optimizes database connections
4. **Asynchronous Analytics**: Records click data without blocking the response

## License

MIT 