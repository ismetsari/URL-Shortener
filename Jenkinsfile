pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'url-shortener-app:latest'
    }

    stages {

        stage('Build Docker Image') {
            steps {
                sh '''
                echo "Starting Docker Build"
                cd /var/lib/jenkins/workspace/url-shortener/url-shortener
                eval $(minikube docker-env)
                docker build --no-cache -t $DOCKER_IMAGE .
                echo "Docker build completed successfully."
                '''
            }
        }

        stage('Deploy to Minikube') {
            steps {
                sh '''
                echo "Deployment starting."
                cd /var/lib/jenkins/workspace/url-shortener/url-shortener/helm
                helm upgrade --install url-shortener .
                echo "Deployment completed successfully."
                '''
            }
        }
    }
}
