#include <unistd.h>
#include <sys/ioctl.h>
#include <stdlib.h>
#include <ncurses.h>
#define BALL_MOVE_DELAY 10000
typedef struct {
	int x, y, state, color;
} Ball;
int main(int argc, char *argv[]) {
	Ball *balls;
	struct winsize w;
	ioctl(0, TIOCGWINSZ, &w);
	int t_max_l = w.ws_row;
	int t_max_c = w.ws_col;
	balls = malloc(t_max_l * sizeof(Ball));
	char *letter;
	letter = "=>";
	initscr();
	start_color();
	noecho();
	for(int i = 0; i < t_max_l; i++) {
		balls[i].x = i;
		balls[i].color = 0;
		balls[i].state = 1;
	};
	init_pair(1, COLOR_RED, COLOR_BLACK);
	init_pair(2, COLOR_GREEN, COLOR_BLACK);
	init_pair(3, COLOR_BLUE, COLOR_BLACK);
	curs_set(FALSE);
	while(1) {
		clear();
		for(int i = 0; i < t_max_l; i++) {
			attron(COLOR_PAIR(balls[i].color));
			if(balls[i].state == 1) {
				balls[i].x++;
				balls[i].color = 2;
				letter = "=>";
			} else if(balls[i].state == 2) {
				balls[i].x--;
				balls[i].color = 1;
				letter = "<=";
			}
			if(balls[i].x == t_max_c - 2) {
				balls[i].state = 2;
				balls[i - 1].color = 3;
				balls[i].color = 1;
			} else if(balls[i].x == 0) {
				balls[i].state = 1;
				balls[i - 1].color = 3;
				balls[i].color = 2;
			}
			mvprintw(i, balls[i].x, "%s", letter);
		};
		usleep(BALL_MOVE_DELAY);
		refresh();
	};
	endwin();
}
