#!/bin/bash

# Configuration
PGHOST=${PGHOST:-192.168.49.2}
PGPORT=${PGPORT:-30032}
PGUSER=${PGUSER:-postgres}
PGDATABASE=${PGDATABASE:-urlshortener}
PGPASSWORD=${PGPASSWORD:-postgres}

# Run query with expanded output and no pager
PGPASSWORD=$PGPASSWORD psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE --pset=pager=off <<EOF
\x on
SELECT * FROM urls;
EOF
