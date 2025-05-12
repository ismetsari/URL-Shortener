#!/bin/bash

# Configuration
minikube_ip=$(minikube ip)
PGHOST=${PGHOST:-$minikube_ip}
PGPORT=${PGPORT:-30032}
PGUSER=${PGUSER:-postgres}
PGDATABASE=${PGDATABASE:-urlshortener}
PGPASSWORD=$(kubectl get secret postgres-credentials -o jsonpath="{.data.postgres-password}" | base64 --decode)

# Run query with expanded output and no pager
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE --pset=pager=off <<EOF
\x on
SELECT * FROM urls;
EOF
