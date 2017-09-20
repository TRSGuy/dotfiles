#/bin/sh
#/home/vorap/Scripts/get_internet_speeds.sh &
host_is_up() {
	if ping -c 1 $1 &> /dev/null
	then
		echo -n "%{F#00FF00}${2^^}%{F#FFFFFF}"
	else
		echo -n "%{F#FF0000}${2^^}%{F#FFFFFF}"
	fi
}
clock() {
	DATETIME=$(date "+%a %b %d %T")
	echo -n "%{r}$DATETIME"
}
song() {
	SPOT_SONG=$(python /home/vorap/Scripts/get_now_playing_spotify_linux.py)
	#MPC_SONG=$(mpc | head -n 1)
	echo -n $SPOT_SONG
}
battery() {
    echo $(acpi | awk '{print(substr($3, 1, 1))}')$(acpi | awk '{print(substr($4, 1, length($4)-2))}')
}
while true; do
	echo "%{c} %{F#FFFFFF}%{B#00000000} \
$(python /home/vorap/Scripts/get_workspace.py)\
$(song)\
$(ip address | grep -v "inet6" | grep "global" | awk '{print $2}' | awk -F "/" '{print $1}')\
$(host_is_up voraschem.tk V)\
$(clock)\
$(battery)"
#$(host_is_up olympiaserv.ddns.net O)\
#FS.VOXELNET.IO: $(host_is_up fs.voxelnet.io) | \
#%{F#00FF00}$(cat /home/vorap/Scripts/speed.download)%{F#FFFFFF}\
#%{F#00FF00}$(cat /home/vorap/Scripts/speed.upload)%{F#FFFFFF}\
#APP1.VOXELNET.IO: $(host_is_up app1.voxelnet.io) | \
#NS.VOXELNET.IO: $(host_is_up ns.voxelnet.io) | \
#AUTH.VOXELNET.IO: $(host_is_up auth.voxelnet.io)"
	sleep 1
done
