#include <ncurses.h>
#include <string.h>
#include <unistd.h>
#ifndef CURSE_THIS_TOOL_H_
#define CURSE_THIS_TOOL_H_
void initialize() {
	initscr();
	noecho();
	curs_set(FALSE);
	//start_color();
}
void slowprint(int instantDraw, int x, int y, char* str, int mode, int delay) {
	for(int i = 0; i < strlen(str); i++) {
		if(instantDraw == 1) {
			refresh();
			usleep(delay * 1000);
		}
		if(mode == 0) {
			mvprintw(y, x + i, "%c", str[i]);
		} else if(mode == 1) {
			mvprintw(y +i, x, "%c", str[i]);
		};
	}
}
void vclear(int instantDraw, int ln, int sx, int ex, char c, int delay) {
	for(int x = sx; x < ex; x++) {
		mvprintw(ln, x, "%c", c);
		if(instantDraw == 1) {
			refresh();
		}
		usleep(delay * 1000);
	}
	refresh();
}
void drawbox(int instantDraw, int s[], int e[], char h, char v) {
	for(int x = s[1]; x < e[1]; x++) {
		mvprintw(e[0], x, "%c", h);
		mvprintw(s[0], x, "%c", h);
		if(instantDraw == 1) {
			refresh();
		}
	}
	for(int y = s[0]; y < e[0]; y++) {
		mvprintw(y, e[1], "%c", v);
		mvprintw(y, s[1], "%c", v);
		if(instantDraw == 1) {
			refresh();
		}
	};
	mvprintw(s[0], s[1], "%c", '+'); // y = by; x = bx
	mvprintw(e[0], e[1], "%c", '+'); // y = ey; x = ex
	mvprintw(s[0], e[1], "%c", '+'); // y = by; x = ex
	mvprintw(e[0], s[1], "%c", '+'); // y = ey; x = bx
	refresh();
}
void drawfill(int instantDraw, int s[], int e[], char c) {
	for(int x = s[1]; x < e[1]; x++) {
		for(int y = s[0]; y < e[0]; y++) {
			mvprintw(y, x, "%c", c);
			if(instantDraw == 1) {
				refresh();
			}
		}
	}
	if(instantDraw == 0) {
		refresh();
	}
}
/* void drawbar(int instantDraw, int x, int y, int h, int w, char c, int color, int o, int delay) {
	init_pair(color, color, 0);
	attron(COLOR_PAIR(color));
	for(int i = y; i > y - h; i--) {
		for(int j = x; j < w; j++) {
			mvprintw(i - o, j, "%c", c);
		}
		if(instantDraw == 1) {
			refresh();
			usleep(delay * 1000);
		}
	}
	attroff(COLOR_PAIR(color));
} */
/*
void rainbowprint(int x, int y, char* str, int mode, int delay) {
	int color = 1;
	for(int i = 0; i < strlen(str); i++) {
		if(color == 9) {
			color = 1;
		} else {
			color++;
		}
		init_pair(color, color, 0);
		attron(COLOR_PAIR(color));
		usleep(delay * 1000);
		if(mode == 0) {
			mvprintw(y, x + i, "%c", str[i]);
		} else if(mode == 1) {
			mvprintw(y + i, x, "%c", str[i]);
		}
		attroff(COLOR_PAIR(color));
		refresh();
	}
}
*/
void end() {
	endwin();
}
#endif
