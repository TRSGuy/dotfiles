import glob
pathlist = glob.glob('/home/vorap/Wallpapers/*')
filelist = []
for i in pathlist:
    filelist.append(i.strip('/home/vorap/Wallpapers/'))
print(filelist)
