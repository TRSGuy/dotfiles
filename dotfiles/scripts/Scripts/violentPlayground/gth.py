def get_running_path():
    import sys
    script_path = sys.argv[0]
    if not ('/' in script_path):
        return './'
    else:
        script_path_list = script_path.split('/')[:-1]
        script_directory = "/".join(script_path_list)
        if(script_directory.startswith("./")):
            return script_directory
        else:
            script_directory = './' + script_directory
            return script_directory
print(get_running_path())
