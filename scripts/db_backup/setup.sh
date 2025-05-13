#!/bin/bash

INSTALL_DIR="/usr/local/bin"
SCRIPT_NAME="backup_postgres"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copy the backup script to a known location
sudo install -m 755 "$REPO_DIR/$SCRIPT_NAME.sh" "$INSTALL_DIR/$SCRIPT_NAME"

# Add cron job for current user (e.g., ismet)
CRON_JOB="0 2 * * * $INSTALL_DIR/$SCRIPT_NAME >> /home/$USER/postgres_backup.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "$CRON_JOB"; echo "$CRON_JOB") | crontab -
