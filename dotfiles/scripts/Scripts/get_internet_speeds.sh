#!/bin/sh
while true;
do
	SPEED=$(speedtest-cli | grep "Mbit/s" | awk '{print $2}')
	DOWNLOAD=$(echo $SPEED | awk '{print $1}')
	UPLOAD=$(echo $SPEED | awk '{print $2}')
	rm /home/vorap/Scripts/speed.download
	truncate -s 0 /home/vorap/Scripts/speed.download
	truncate -s 0 /home/vorap/Scripts/speed.upload
	echo "$DOWNLOAD" >> /home/vorap/Scripts/speed.download
	echo "$UPLOAD" >> /home/vorap/Scripts/speed.upload
	sleep 600
done
