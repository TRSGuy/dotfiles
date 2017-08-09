resp=$(ping $1 -c 1)
echo $resp
if [[ $resp =~ *"PING" ]]; then
	echo "Host $1 is up"
fi

