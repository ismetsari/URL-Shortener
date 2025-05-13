#!/bin/bash
set -e

# Get PostgreSQL host and password from Minikube/Kubernetes
postgre_host=$(minikube ip)
postgre_password=$(kubectl get secret postgres-credentials -o jsonpath="{.data.postgres-password}" | base64 --decode)

# Create backup directory
TIMESTAMP=$(date +"%F")
BACKUP_DIR="/home/$USER/postgres_backups"
mkdir -p "$BACKUP_DIR"

# PostgreSQL connection details
PGHOST=$postgre_host
PGPORT="30032"
PGUSER="postgres"
export PGPASSWORD=$postgre_password

# Perform backup
pg_dump -F c -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" urlshortener | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
