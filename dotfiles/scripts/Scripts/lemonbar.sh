#/bin/sh
/home/vorap/Scripts/get_internet_speeds.sh &
host_is_up() {
	if ping -c 1 $1 &> /dev/null
	then
		echo -n "%{F#00FF00}Up%{F#FFFFFF}"
	else
		echo -n "%{F#FF0000}Down%{F#FFFFFF}"
	fi
}
clock() {
	DATETIME=$(date "+%a %b %d, %T")
	echo -n "$DATETIME"
}
song() {
	SPOT_SONG=$(python /home/vorap/Scripts/get_now_playing_spotify_linux.py)
	#MPC_SONG=$(mpc | head -n 1)
	echo -n $SPOT_SONG
}
while true; do
	echo "%{c} %{F#FFFFFF}%{B#44000000} \
$(clock) | \
$(song) | \
$(ip address | grep -v "inet6" | grep "global" | awk '{print $2}' | awk -F "/" '{print $1}') | \
Download: %{F#00FF00}$(cat /home/vorap/Scripts/speed.download)%{F#FFFFFF} Mbit/s | \
Upload: %{F#00FF00}$(cat /home/vorap/Scripts/speed.upload)%{F#FFFFFF} Mbit/s | \
FS.VOXELNET.IO: $(host_is_up fs.voxelnet.io) | \
APP1.VOXELNET.IO: $(host_is_up app1.voxelnet.io) | \
NS.VOXELNET.IO: $(host_is_up ns.voxelnet.io) | \
AUTH.VOXELNET.IO: $(host_is_up auth.voxelnet.io)"
	sleep 1
done
