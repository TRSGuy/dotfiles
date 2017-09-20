#!/bin/sh
while true; do
	python /home/vorap/Scripts/get_now_playing_spotify_linux.py > /home/vorap/Scripts/nowplaying.status
	sleep 1
done
