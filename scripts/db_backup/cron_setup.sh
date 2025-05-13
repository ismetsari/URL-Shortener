#!/bin/bash
# cron_setup.sh

# This will run the backup script every day at 2am
CRON_JOB="0 2 * * * /usr/local/bin/backup_postgres.sh"

# Check if it's already set
( crontab -l 2>/dev/null | grep -v -F "$CRON_JOB" ; echo "$CRON_JOB" ) | crontab -
