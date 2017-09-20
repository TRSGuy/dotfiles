import dbus
session_bus = dbus.SessionBus()
try:
    spotify_bus = session_bus.get_object("org.mpris.MediaPlayer2.spotify", "/org/mpris/MediaPlayer2")
    spotify_properties = dbus.Interface(spotify_bus, "org.freedesktop.DBus.Properties")
    metadata = spotify_properties.Get("org.mpris.MediaPlayer2.Player", "Metadata")
    def now_playing():
        artist = str(list(metadata['xesam:artist']))[14:-3]
        title = metadata['xesam:title']
        print(''+artist+''+title)
    now_playing()
except Exception:
    print('Nothing is playing')
