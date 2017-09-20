import praw
import requests
import subprocess
import glob
pathlist = glob.glob('/home/vorap/Wallpapers/*')
filelist = []
for i in pathlist:
	filelist.append(i.split('/')[-1])

reddit = praw.Reddit(client_id='gLADEdHSMGqqCQ',
	client_secret='EmgK9MLzc83hgcLFrewIUcSi5FY',
	password='Pipisawesome098!',
	username='ParanoidBox',
	user_agent='WallpaperGrabber by /u/ParanoidBox')
allowed_formats = ['jpg', 'png']
wallpaper = reddit.subreddit('wallpaper').submissions()
wallpaper_url = ''
wallpaper_file_name = ''
file_format = ''
downloaded_files = glob.glob('/home/vorap/Wallpapers/')
for i in wallpaper:
	wallpaper_url = i.url
	file_format = wallpaper_url.split('.')[-1]
	wallpaper_file_name = wallpaper_url.split('/')[-1]
	if(file_format in allowed_formats):
		if not(wallpaper_file_name in filelist):
			break
		else:
			pass
	else:
		pass
wall_r = requests.get(wallpaper_url)
with open('/home/vorap/Wallpapers/' + wallpaper_file_name, 'wb') as file:
	file.write(b'')
	file.write(wall_r.content)
subprocess.call(['/home/vorap/Scripts/set_background.sh', '/home/vorap/Wallpapers/' + wallpaper_file_name])
