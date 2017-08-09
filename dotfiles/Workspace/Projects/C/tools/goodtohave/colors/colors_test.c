#include <stdio.h>
#include <curses.h>
#define MAXROW 1000
#define MAXCOL 500

WINDOW *scrn;
char cmdoutlines[MAXROW][MAXCOL];
int ncmdlines, nwinlines, winrow, cmdstartrow, cmdlastrow;
void highlight() {
	int clinenum;
	attron(A_BOLD);
	clinenum = cmdstartrow + winrow;
	mvaddstr(winrow, 0, cmdoutlines[clinenum]);
	attroff(A_BOLD);
	refresh();
}

void runpsax() {
	FILE *p;
	char ln[MAXCOL];
	int row, tmp;
	p = popen("ps ax", "r");
	for (row = 0; row < MAXROW; row++) {
		tmp = fgets(ln, MAXCOL, p);
		if (tmp == NULL) {
			break;
		}
		strncopy(cmdoutlines[row], ln, COLS);
		cmdoutlines[row][MAXCOL-1] = 0;
	}
	ncmdlines = row;
	close(p);
}

void showlastpart() {
	int row;
	clear();
	if (ncmdlines <= LINES) {
		cmdstartrow = 0;
		nwinlines = ncmdlines;
	};
	else {
		cmdstartrow = ncmdlines - LINES;
		nwinlines = LINES;
	}
	cmdlastrow = cmdstartrow + nwinlines - 1;
	for (row = cmdstartrow, winrow = 0; row <= cmdlastrow; row++, winrow++) {
		
	}
}
