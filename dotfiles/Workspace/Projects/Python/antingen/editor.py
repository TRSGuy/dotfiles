import pygame, sys
class Text():
    def __init__(self):
        self.text = {
                    "rawtext": "",
                    "lines": ['']
                }
class Cursor():
    def __init__(self):
        self.pos = {
                    "col": 0,
                    "row": 0
                }
class Window():
    def __init__(self, cursor, text):
        self.c = cursor
        self.t = text
        pygame.init()
        self.sa = ["\r", "\x08", "\x03"]
        self.s = {
                    "width": 100,
                    "height": 100,
                    "color": {
                        "black": (0, 0 ,0),
                        "red": (255, 0, 0),
                        "green": (0, 255, 0),
                        "blue": (0, 0, 255),
                        "white": (255, 255, 255)
                        },
                    "font": pygame.font.SysFont("ubuntumono", 15),
                    "screen": "<screen>",
                    "running": True
                }
        self.s["screen"] = pygame.display.set_mode((self.s["width"], self.s["height"]), pygame.RESIZABLE)
        self.clock = pygame.time.Clock()
    def co(self, t):
        if not(t == ''):
            if(t == "\x11"):
                sys.exit()
    def i(self, d):
        if(d["mod"] == 64):
            self.co(d["unicode"])
        elif(d["unicode"] in self.sa):
            index = self.sa.index(d["unicode"])
            if(index == 1):
                self.t.text["lines"][self.c.pos["row"]] = self.t.text["lines"][self.c.pos["row"]][:-1]
                if(self.c.pos["col"] > 0):
                    self.c.pos["col"] -= 1
                elif(self.c.pos["row"] > 0):
                    self.c.pos["row"] -= 1
                    self.c.pos["col"] = len(self.t.text["lines"][self.c.pos["row"]])
            elif(index == 0):
                self.c.pos["row"] += 1
                self.c.pos["col"] = 0
                self.t.text["lines"].append("")
                self.t.text["rawtext"] += "\n"
        elif not(d["unicode"] == ""):
            self.t.text["lines"][self.c.pos["row"]] += d["unicode"]
            self.c.pos["col"] += 1
        self.draw()
    def update(self):
        while(self.s["running"]):
            self.clock.tick(20)
            for i in pygame.event.get():
                if(i.type == pygame.QUIT):
                    sys.exit()
                elif(i.type == pygame.VIDEORESIZE):
                    self.s["width"] = i.__dict__["w"]
                    self.s["height"] = i.__dict__["h"]
                    self.s["screen"] = pygame.display.set_mode((self.s["width"], self.s["height"]), pygame.RESIZABLE)
                    pygame.display.flip()
                elif(i.type == pygame.KEYDOWN):
                    print(i.__dict__)
                    self.i(i.__dict__)
            self.draw()
    def draw(self):
        self.s["screen"].fill(self.s["color"]["black"])
        rows = []
        for l in self.t.text["lines"]:
            rows.append(self.s["font"].render(l, False, self.s["color"]["white"]))
        for i in range(len(rows)):
            self.s["screen"].blit(rows[i], (0, 15 * i))
        pygame.draw.line(self.s["screen"], self.s["color"]["white"], [self.c.pos["col"] * 8, 14 * self.c.pos["row"]], [self.c.pos["col"] * 8, 14 * self.c.pos["row"] + 14])
        pygame.display.flip()
t = Text()
c = Cursor()
w = Window(c, t)
w.update()
