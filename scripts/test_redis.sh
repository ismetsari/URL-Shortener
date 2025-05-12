#!/bin/bash

# Configuration
REDIS_HOST=${REDIS_HOST:-192.168.49.2}
REDIS_PORT=${REDIS_PORT:-30033}
REDIS_PASSWORD=${REDIS_PASSWORD:-"fM3NRGz9b5"}

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
