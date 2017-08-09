/* ===STRUCT:SNAKE===
 * hx = Head X coordinate
 * hy = Head Y coordinate
 * hd = Head Direction // See direction table
 * l = Snake Length
 * b = Array of where things should change direction // See Direction table
 * ===DIRECTION TABLE===
 * | Direction | Int |
 * |-----------|-----|
 * | Left      |  0  |
 * | Down      |  1  |
 * | Right     |  2  |
 * | Up        |  3  |
 * |-----------|-----|
 */
#include <ncurses.h>
#include <sys/ioctl.h>
#include <stdlib.h>
#define MAX_SNAKE_LENGTH 100
#define START_LENGTH 2
typedef struct {
	int x, y, d, e;
} Snake;
int main(int argc, char *argv[]) {
	Snake *s;
	struct winsize w;
	s = malloc(MAX_SNAKE_LENGTH * sizeof(Snake));
	for(int i = 0; i < MAX_SNAKE_LENGTH; i++) {
		if(i > START_LENGTH) {
			s[i].x = 0;
			s[i].y = i;
			s[i].d = 1;
			s[i].e = 1;
		}
	}
	ioctl(0, TIOCGWINSZ, &w);
	// Total rows w.ws_row
	// Total cols w.ws_col
	initscr();
	start_color();
	noecho();
	init_pair(1, COLOR_RED, COLOR_BLACK);
	init_pair(2, COLOR_GREEN, COLOR_BLACK);
	init_pair(3, COLOR_BLUE, COLOR_BLACK);
	curs_set(FALSE);
	while(1) {
		clear();
		for(int i = 0; i < MAX_SNAKE_LENGTH; i++) {
			if(s[i].e == 1) { // If it should exist, do something with it
				mvprintw(s[i].y, s[i].x, "0");
			};
		}
		// mvprintw(y, x, "char");
		refresh();
	};
	endwin();
}
