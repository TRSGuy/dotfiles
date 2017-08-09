#!/bin/sh

setxkbmap se
xset m 0 0
xrandr --output HDMI-0 --above DP-4
#xrandr --output DVI-D-0 --right-of HDMI-0
xrandr --output DP-4 --mode 1920x1080 --rate 144
exec xcompmgr &
