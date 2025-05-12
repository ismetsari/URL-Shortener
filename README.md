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
```bash
git clone github.com/ismetsari/url-shortener
```

  2. Go to the scripts directory to install dependencies by using script:
   ```
   cd url-shortener/scripts
   ./setup-dev-tools.sh
   ```
   Reboot is required after script is executed.
   If jenkins asks for password use below command to take password
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
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
sudo mv ~/url-shortener /var/lib/jenkins/workspace/url-shortener
```
5. Ensure that the jenkins user is a member of the docker group. You can verify this by running the command **groups jenkins**. If the jenkins user is not a member, add it using the usermod command.
```bash
sudo usermod -aG docker $USER && newgrp docker
```
After that restart Jenkins
```bash
systemctl restart jenkins
```

6. Navigate to the terraform directory to provision minikube cluster:
   ```
   cd /var/lib/jenkins/workspace/url-shortener/url-shortener/terraform
   terraform init
   terraform apply
   ```
   If you run project first time you need to run terraform init otherwise terraform apply is enough.

7. Jenkins runs pipelines using the jenkins user. To ensure proper Kubernetes access, the jenkins user must have a correctly configured kubeconfig and certificates. **If these are already set up, you can skip step 7 completely.** If not there are two ways to achieve this:

**IMPORTANT NOTE:** 7.1 is a more robust approach, but it requires some UI configurations. To simplify the project setup for you, I used 7.2, as it only requires a simple copy-paste.

7.1 Storing kubeconfig file as Jenkins credentials (This is the more robust way)
- Log into Jenkins UI
- Go to "Manage Jenkins" → "Credentials"
- Click on the domain where you want to store credentials (typically "global")
- Click "Add Credentials" in right top corner   
- From the "Kind" dropdown, select "Secret file"
- Click "Browse" and upload your kubeconfig file
- In the "ID" field, enter a meaningful ID like kubeconfig-minikube
- Click "OK" to save
- Then change **Deploy to Minikube** stage in Jenkinsfile to below code.
- You also need to apply same stages for certificates. Do not forget to reference the credentials and add them to kubectl command.
```bash
    stage('Deploy to Minikube') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-minikube', variable: 'KUBECONFIG')]) {
          sh '''
          echo "Deployment starting."
          cd flask-application
          kubectl --kubeconfig=$KUBECONFIG apply -f k8s/
          kubectl --kubeconfig=$KUBECONFIG rollout restart deployment flask-application
          echo "Deployment completed successfully."
          '''
        }
      }
    }
```
7.2 If they exist for another user, **log in to that user** and copy the kubeconfig and certificates to the Jenkins user's target directory.
```bash
# Create .kube directory for jenkins user
sudo mkdir -p /var/lib/jenkins/.kube
# Copy your config file
sudo cp ~/.kube/config /var/lib/jenkins/.kube/
# Change ownership to jenkins user
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube/
# Create directories jor jenkins
sudo mkdir -p /var/lib/jenkins/.minikube
# Copy your minikube certificates
sudo cp -r ~/.minikube/* /var/lib/jenkins/.minikube/
# Fix the paths in the copied config file
sudo sed -i "s|$HOME/.minikube|/var/lib/jenkins/.minikube|g" /var/lib/jenkins/.kube/config
# Set ownership of directories(this is the critical part)
sudo chown -R jenkins:jenkins /var/lib/jenkins/.minikube
# Set permissions on all files first
sudo find /var/lib/jenkins/.minikube -type f -exec chmod 644 {} \;
sudo find /var/lib/jenkins/.kube -type f -exec chmod 644 {} \;
# Now set proper permissions on key files
sudo find /var/lib/jenkins/.minikube -name "*.key" -exec chmod 600 {} \;
```

- After making these changes restart jenkins and docker services.
```bash
systemctl restart jenkins
systemctl restart docker
```

- Restarting services can affect Minikube. Check its status using the **minikube status** command. If it is not running, start it again.
```bash
cd /var/lib/jenkins/workspace/url-shortener/url-shortener/terraform
terraform init
terraform apply
```


8. Now run Jenkins pipeline the build and deployment process will be handled by pipeline.

## How to Test Application
To shorten a URL, send a POST request to /api/urls endpoint:

1) Using curl:
```bash
curl -X POST http://<minikube-ip>:30031/api/urls -H "Content-Type: application/json" -d '{"originalUrl": "https://google.com"}'
curl -X POST http://<minikube-ip>:30031/api/urls -H "Content-Type: application/json" -d '{"originalUrl": "https://youtube.com"}'
```
2) Using Postman or any API client:
- Set method to POST
- Set URL to http://<minikube-ip>:30031/api/urls
- Add header: Content-Type: application/json
- Set request body (JSON)
- Paste below body and send request
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
  original_url | https://github.com/ismetsari/flask-application
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