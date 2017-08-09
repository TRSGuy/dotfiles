#!/bin/sh

/home/vorap/scripts/get_internet_speeds.sh &
echo '{"version":1}'
echo '['
echo '[],'
function get_disk_space() {
	local USED=$(df $1 -h | tail -n 1 | awk '{print $3}')
	local FREE=$(df $1 -h | tail -n 1 | awk '{print $2}')
		if [[ $2 == "USED" ]];
		then
			echo "$USED"
		else
			echo "$FREE"
		fi

}

while : true;
do
	DATE=$(date)
	#SONG=$(python3 /home/vorap/Scripts/get_now_playing_spotify_linux.py)
	SONG=$(mpc status | head -n 1)
	CPU_ALL_USAGE=$(mpstat | grep -A 1 "%idle" | tail -n 1 | awk '{print 100 - $13}')
	UPLOAD=$(cat /home/vorap/Scripts/speed.upload)
	DOWNLOAD=$(cat /home/vorap/Scripts/speed.download)
	IP_ADDRESS=$(ip address | grep "inet" | grep "global" | awk '{print $2}' | awk -F "/" '{print $1}' | awk -F '\n' '{print $1}')
	#IP_ADDRESS="Broken atm"
	ROOT_USED=$(get_disk_space / USED)
	ROOT_FREE=$(get_disk_space /)
	FILE_SERVER_USED=$(get_disk_space /mnt/fileserver USED)
	FILE_SERVER_FREE=$(get_disk_space /mnt/fileserver)
	MEM_TOTAL=$(free -h | grep "Mem" | awk '{print $2}')
	MEM_USED=$(free -h | grep "Mem" | awk '{print $3}')
	echo "\
[\
{\
\"full_text\":\
\"${SONG}\"\
},\
{\
\"full_text\":\
\" $DOWNLOAD Mbit/s\"\
},\
{\
\"full_text\":\
\" $UPLOAD Mbit/s\"\
},
{\
\"full_text\": \"CPU Usage: ${CPU_ALL_USAGE}%\"
},\
{\
\"full_text\": \"IP Address: ${IP_ADDRESS}\"
},\
{\
\"full_text\": \" /: U: ${ROOT_USED} F: ${ROOT_FREE} | /mnt/fileserver U: ${FILE_SERVER_USED}B F: ${FILE_SERVER_FREE}B\"
},\
{\
\"full_text\": \"RAM: U: ${MEM_USED}B T: ${MEM_TOTAL}B\"
},\
{\
\"full_text\": \"${DATE}\"\
}\
],"
	sleep 5
done
