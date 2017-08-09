import serial, time
s = serial.Serial('/dev/ttyACM0', 9600)
time.sleep(1)
s.write(b"\xFF\xFF")
def changeColor(string):
    R = int(string[1:3], 16)
    G = int(string[3:5], 16)
    B = int(string[5:7], 16)
    text = b"R" + bytes([R]) + b"G" + bytes([G]) + b"B" + bytes([B])
    s.write(text)
    print(text)
    print(string)
changeColor("#979BA7")
time.sleep(10)
