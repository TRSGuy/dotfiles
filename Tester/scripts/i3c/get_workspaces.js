var com = "/usr/bin/i3-msg -t get_workspaces";
var p = require("shelljs");
var j = JSON.parse(p.exec(com))[0][0]
for(var i = 0; i < j.length; i++) {
	console.log(j[i]);
};
