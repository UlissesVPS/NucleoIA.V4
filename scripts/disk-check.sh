#!/bin/bash
# Disk usage monitoring - alert when usage > 80%
THRESHOLD=80
USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
DATE=$(date '+%Y-%m-%d %H:%M')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "[$DATE] ALERTA: Disco em ${USAGE}% (limiar: ${THRESHOLD}%)" >> /var/log/disk-alerts.log
    # Log to PM2 so it shows in pm2 logs
    echo "DISK ALERT: Usage at ${USAGE}% - cleanup needed!"
fi
