import requests
class voice_synth:
    def __init__(self, cl_login, cl_app, cl_pwd):
        self.req_voice = 'kal22k'
        self.cl_login = cl_login
        self.cl_app = cl_app
        self.cl_pwd = cl_pwd
        self.req_vol = '65535'
        self.req_speed = '180'
        self.req_vct = '100'

    def generate_voice(self, text):
        r = requests.post("http://vaas.acapela-group.com/Services/Synthesizer", data = {'prot_vers': '2', 'cl_login': self.cl_login, 'cl_pwd': self.cl_pwd, 'cl_app': self.cl_app, 'req_voice': self.req_voice, 'req_text': text, 'req_vol': self.req_vol, 'req_speed': self.req_speed, 'req_vct': self.req_vct})
        return self.get_link(r.content)

    def get_link(self, api_response):
        self.api_response = api_response.decode('utf-8')
        return self.api_response[self.api_response.find('snd_url') + 8:self.api_response.find('&snd_size')]

v_test = voice_synth('EVAL_VAAS', 'EVAL_2612189', 'm3g1kdgb')
print(v_test.generate_voice('This is a stickup'))

