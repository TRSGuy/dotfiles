#!/bin/bash
colors=$(cat /home/vorap/.cache/wal/colors | head -n 4 | tail -n 1 | awk -F "#" '{ print tolower($2)}')
scrot '/home/vorap/Scripts/scrot/lock.png'
#convert -resize 10% '/home/vorap/Scripts/scrot/lock.png' '/home/vorap/Scripts/scrot/lock.png'
convert -blur 0x4 '/home/vorap/Scripts/scrot/lock.png' '/home/vorap/Scripts/scrot/lock.png'
composite -geometry +710+1340 '/home/vorap/Scripts/scrot/lockOverlay.png' '/home/vorap/Scripts/scrot/lock.png' '/home/vorap/Scripts/scrot/lock.png'
i3lock -i "/home/vorap/Scripts/scrot/lock.png" -r 100

