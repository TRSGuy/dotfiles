#!/bin/sh
feh --bg-fill $1
notify-send "Background Changed" "$1" --app-name=set_background.sh
