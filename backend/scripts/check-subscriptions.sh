#!/bin/bash
# check-subscriptions.sh - Wrapper for subscription expiry check
# Runs via cron every hour

LOGFILE=/var/log/nucleoia-subscriptions.log
SCRIPT_DIR=/var/www/nucleoia/backend/scripts

echo >> $LOGFILE
echo ======================================== >> $LOGFILE
echo [$(date +%Y-%m-%d_%H:%M:%S)] Running subscription check >> $LOGFILE
echo ======================================== >> $LOGFILE

sudo -u postgres psql -d nucleoia_db -f $SCRIPT_DIR/check-subscriptions.sql >> $LOGFILE 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo [$(date +%Y-%m-%d_%H:%M:%S)] Completed successfully >> $LOGFILE
else
    echo [$(date +%Y-%m-%d_%H:%M:%S)] FAILED with exit code $EXIT_CODE >> $LOGFILE
fi

tail -1000 $LOGFILE > $LOGFILE.tmp && mv $LOGFILE.tmp $LOGFILE
exit $EXIT_CODE
