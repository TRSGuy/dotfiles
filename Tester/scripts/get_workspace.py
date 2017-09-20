import sys
import json
import os
js = os.popen("i3-msg -t get_workspaces").read()
j = json.loads(js)
s = []
s.append("%{l}")
for i in j:
    if(i["focused"]):
        s.append("%{F#00FF00} " + str(i["num"]) + "%{F#FFFFFF}")
    else:
        s.append("%{F#FFFFFF} " + str(i["num"]))
s.append("%{c}")
print("".join(s))
