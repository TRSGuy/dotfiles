#!/bin/bash
function doesExist() {
	if [ ! -f $1 ];
	then
		echo "false"
	else
		echo "true"
	fi
}

function drawProgressBar() {
	while [ ! $FILE_ONE_SIZE -eq $FILE_TWO_SIZE ];
	do
		PROGRESS=$($FILE_ONE_SIZE / $FILE_TWO_SIZE)
		PRINTF_COMMAND="printf '=%.0s' {1..$PROGRESS}"
		echo $PRINTF_COMMAND
		echo $PROGRESS
	done
}

function getSize() {
	echo $(du $1 | awk '{print $1}')
}

FILE_ONE_EXIST=$(doesExist $1)
FILE_TWO_EXIST=$(doesExist $2)

if [ $FILE_ONE_EXIST == "true" ];
then
	if [ $FILE_TWO_EXIST == "true" ];
	then
		FILE_ONE_SIZE=$(getSize $1)
		FILE_TWO_SIZE=$(getSize $2)
		if [ $FILE_ONE_SIZE -eq $FILE_TWO_SIZE ];
		then
			echo "Theese files are already the same size, there is no file transfer in process"
		else
			drawProgressBar
	fi
fi
echo "Done"
