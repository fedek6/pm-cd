#!/bin/bash

source .env

# Use lftp to mirror the local directory to the remote directory
lftp -f "
set ftp:ssl-allow no
set net:timeout 10
set net:max-retries 2
set net:reconnect-interval-base 5
set ftp:passive-mode yes
open $FTP_HOST
user $FTP_USER $FTP_PASS
lcd $LOCAL_DIR
cd $REMOTE_DIR
mirror --reverse --verbose --delete --continue --parallel=2 --no-perms --exclude .htaccess --exclude uploads
bye
"
