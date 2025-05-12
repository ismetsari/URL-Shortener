#!/bin/bash

# Configuration
minikube_ip=$(minikube ip)
REDIS_HOST=${REDIS_HOST:-$minikube_ip}
REDIS_PORT=${REDIS_PORT:-30033}
REDIS_PASSWORD=$(kubectl get secret url-shortener-redis -o jsonpath="{.data.redis-password}" | base64 --decode)

# Run test commands
if [[ -n "$REDIS_PASSWORD" ]]; then
  redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD <<EOF
KEYS *
EOF
else
  redis-cli -h $REDIS_HOST -p $REDIS_PORT <<EOF
KEYS *
EOF
fi
