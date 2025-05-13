# URL Shortener

A high-performance URL shortener service that uses Redis for caching and PostgreSQL for permanent storage.

## Why Did I Choose This Project?

- Simple and functional
- Multiple endpoints
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
- Curl
- Postgresql
- Redis

## Services
- **URL Shortener**: Provides an API to create shortened URLs and manage their lifecycle, including expiration and analytics.
- **Redis**: Acts as an in-memory data store for caching URL mappings and click counts to enhance performance and reduce database load.
- **PostgreSQL**: Serves as the primary data store for persistent storage of URL mappings and analytics data.

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

## Project Structure

```
url-shortener/
├── .git/                     # Git version control directory
├── scripts/                  # Contains scripts for setup, testing, and other utilities
│   ├── db_backup/            # Database backup scripts
│   │   ├── setup.sh          # Setup script for database backups
│   │   ├── backup_postgres.sh# Script to backup PostgreSQL database
│   │   └── cron_setup.sh     # Script to setup cron jobs for backups
│   ├── generate_configmap.sh # Script to generate Kubernetes ConfigMap
│   ├── setup-dev-tools.sh    # Script to set up development tools
│   ├── test_postgres.sh      # Script to test PostgreSQL setup
│   └── test_redis.sh         # Script to test Redis setup
├── terraform/                # Infrastructure as code for provisioning resources using Terraform
│   └── main.tf               # Main Terraform configuration
├── helm/                     # Helm charts for Kubernetes deployment
│   ├── values.yaml           # Helm values configuration
│   ├── templates/            # Helm templates
│   │   ├── _helpers.tpl      # Helper templates
│   │   ├── db-connection.yaml# Database connection configuration
│   │   ├── deployment.yaml   # Deployment configuration
│   │   └── service.yaml      # Service configuration
│   ├── Chart.lock            # Helm chart lock file
│   ├── Chart.yaml            # Helm chart metadata
│   └── charts/               # Helm chart dependencies
│       ├── redis-19.5.4.tgz  # Redis chart package
│       └── postgresql-15.5.3.tgz # PostgreSQL chart package
├── src/                      # Source code for the URL shortener application
│   ├── config/               # Configuration files
│   │   ├── postgres.js       # PostgreSQL configuration
│   │   └── redis.js          # Redis configuration
│   ├── controllers/          # Application controllers
│   │   └── url.controller.js # URL controller logic
│   ├── db/                   # Database connection and models
│   │   └── migrations.js     # Database migrations
│   ├── routes/               # API route definitions
│   │   └── url.routes.js     # URL route definitions
│   ├── server.js             # Main server file
│   └── utils/                # Utility functions
│       └── url.utils.js      # URL utility functions
├── README.md                 # Project documentation
├── package.json              # Node.js project metadata and dependencies
├── .gitignore                # Specifies files and directories to be ignored by Git
├── Dockerfile                # Instructions for building the Docker image
└── Jenkinsfile               # Jenkins pipeline configuration for CI/CD
``` 

## Features

- Create shortened URLs with optional expiration dates
- Redis caching for fast URL lookups
- PostgreSQL for persistent storage
- Click tracking and analytics
- Batch processing of click counts for performance optimization

## Cache Strategy

The application uses a cache-aside (lazy loading) strategy:
- URLs are cached in Redis on creation
- Lookups check Redis first, then PostgreSQL if not found
- Successful database lookups update the Redis cache
- Click counts are batched in Redis and periodically flushed to PostgreSQL

### Installation

1. All dependencies will be installed by the script. However, to clone the repository, Git must be installed. If it's not already installed, you can do so using the following command:
```bash
sudo apt-get install git
```
```bash
git clone https://github.com/ismetsari/url-shortener
```

2. Navigate to the scripts directory and run the installation script to install all required dependencies:
```bash
   cd url-shortener/scripts
   ./setup-dev-tools.sh
```
  A system reboot is required after the script has been executed.

3. Go to Jenkins UI and configure the pipeline
  - If you did not specify any port for Jenkins, you can reach it from http://localhost:8080/
  - If jenkins asks for password use below command to take password
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```
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
sudo usermod -aG docker jenkins && newgrp docker
```
After that restart Jenkins
```bash
systemctl restart jenkins
```

6. Navigate to the terraform directory to provision minikube cluster:
```bash
   cd /var/lib/jenkins/workspace/url-shortener/url-shortener/terraform
   terraform init
   terraform apply
```
  If you're running the project for the first time, you need to execute terraform init. For subsequent runs, terraform apply is sufficient.

7. In the values file, there is an environment variable named BASE_URL, which is used by the application to generate the shortened URLs it returns. This variable should be set to the Minikube IP. However, since the Minikube IP can vary between systems, it must be set dynamically. The following shell script creates a ConfigMap containing the current Minikube IP and stores it as the BASE_URL value. This ConfigMap is referenced in the values file to ensure consistency across environments.
```bash
cd /var/lib/jenkins/workspace/url-shortener/url-shortener/scripts
./generate_configmap.sh
```

8. Jenkins runs pipelines using the jenkins user. To ensure proper Kubernetes access, the jenkins user must have a correctly configured kubeconfig and certificates. **If these are already set up, you can skip step 8 completely.** If not there are two ways to achieve this:

**IMPORTANT NOTE:** 8.1 is a more robust approach, but it requires some UI configurations. To simplify the project setup for you, I used 8.2, as it only requires a simple copy-paste.

8.1 Storing kubeconfig file as Jenkins credentials (This is the more robust way)
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
8.2 If they exist for another user, **log in to that user** and copy the kubeconfig and certificates to the Jenkins user's target directory.
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
terraform apply
```

9. Now, run the Jenkins pipeline — it will handle the build and deployment process automatically. You can check the application status by inspecting the pods.
```bash
kubectl get po
```

10. We use a setup script to configure daily database backups. This script automatically handles the creation of the cronjob and places the backup script in the appropriate location. Simply running the setup script is sufficient to enable daily backups.
```
cd /var/lib/jenkins/workspace/url-shortener/url-shortener/scripts/db_backup
./setup.sh
```

## How to Test Application
1) To shorten a URL, start by sending a POST request to the /api/urls endpoint. After that, run the test scripts to verify the results in Redis and PostgreSQL.

There are two ways to send POST requests

1.1 Using curl(Don't forget to replace the <minikube-ip> in the POST request with your actual Minikube IP):
```bash
curl -X POST http://<minikube-ip>:30031/api/urls -H "Content-Type: application/json" -d '{"originalUrl": "https://google.com"}'
curl -X POST http://<minikube-ip>:30031/api/urls -H "Content-Type: application/json" -d '{"originalUrl": "https://youtube.com"}'
```
1.2 Using Postman or any API client(Don't forget to replace the <minikube-ip> in the URL with your actual Minikube IP):
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
2) Testing with scripts

  - Navigate to the scripts directory
```bash
  cd /var/lib/jenkins/workspace/url-shortener/url-shortener/scripts
```

  - Run postgre test script.
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

  - Run redis test script
```bash
  ./test_redis.sh
```

  Expected output will be like below:
```json
  1) "clicks:bEuVjR8"
  2) "clicks:1WzaHeO"
  3) "clicks:JscfaSG"
  4) "url:6Ez2GxE"
  5) "clicks:W8CKCxV"
  6) "clicks:_h86gz4"
```

## Future Works

**Redis caching strategy**: Current implementation assumes single Redis instance. Might need adjustment for Redis Sentinel or cluster deployments

**High availability considerations**:
The app can horizontally scale (it's stateless)
Database connections have pooling but may need tuning for your scale

**Security Enhancements**:
Implement additional security measures such as rate limiting, IP whitelisting, and HTTPS to protect the service from abuse and ensure data privacy.

**Monitoring and Logging**:
Integrate monitoring tools like Prometheus and Grafana for real-time performance tracking and alerting. Enhance logging to capture more detailed information for debugging and analytics.

## Performance Optimizations

**Redis Caching**: Reduces database load for popular URLs
**Batch Click Processing**: Accumulates click counts in Redis and periodically flushes to PostgreSQL
**Connection Pooling**: Optimizes database connections
**Asynchronous Analytics**: Records click data without blocking the response

## License

MIT 