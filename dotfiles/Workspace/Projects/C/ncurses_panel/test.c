#include <sys/ioctl.h>
#include <string.h>
#include <stdlib.h>
#include <stdio.h>
#include "cursethis.h"
void getnowplaying(char* outstr) {
	FILE *fp;
	fp = popen("/usr/bin/mpc", "r");
	if(fp == NULL) {
		slowprint(1, 0, 0, "Command failed to execute", 0, 10);
	} else {
		fgets(outstr, 1000, fp);
		pclose(fp);
	}
}
int getprogress() {
	FILE *fp;
	char outstr[6];
	fp = popen("/usr/bin/mpc | tail -n 2 | head -n 1 | awk -F \"(\" '{print $2}' | awk -F \"%)\" '{print $1}'", "r");
	if(fp == NULL) {
		slowprint(1, 0, 0, "Command failed", 0, 10);
	} else {
		fgets(outstr, 3, fp);
		return atoi(outstr);
	}
	return 0;
}
int main() {
	struct winsize w;
	ioctl(0, TIOCGWINSZ, &w);
	initialize();
	char test[1023];
	char oldtest[1023];
	getnowplaying(oldtest);
	getnowplaying(test);
	int bs[] = {0, 0};
	int be[] = {w.ws_row - 1, w.ws_col - 1};
	int center = 0;
	int secenter = 0;
	while(1) {
		getnowplaying(test);
		if(!(strlen(oldtest) == strlen(test))) {
			drawbox(0, bs, be, '=', '|');
			vclear(1, 2, center, w.ws_col - 2, ' ', 0);
			vclear(1, 4, center, w.ws_col - 2, ' ', 0);
			center = (w.ws_col - strlen(test)) / 2;
			slowprint(1, center, 2, test, 0, 50);
			getnowplaying(oldtest);
		}
		secenter = (w.ws_col - 100) / 2;
		//vclear(1, 4, 1, 1 + getprogress(), '=', 10);
		vclear(1, 4, secenter, secenter + getprogress(), '=', 10);
		usleep(100);
	};
	slowprint(1, 0, 0, test, 0, 100);
	usleep(1000000);
	end();
	return 0;
}
