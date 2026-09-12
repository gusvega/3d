#!/usr/bin/env python3
"""Private single-user SPECTRA bridge. No arbitrary paths or shell execution."""
import concurrent.futures, hashlib, hmac, io, json, math, os, re, secrets, shutil, struct, subprocess, sys, threading, time, uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import numpy as np
import soundfile as sf

ROOT = Path(os.environ['SPECTRA_WEB_DATA']).resolve()
ROOT.mkdir(parents=True, exist_ok=True)
TOKEN_FILE = ROOT / 'access-key'
if not TOKEN_FILE.exists():
    TOKEN_FILE.write_text(secrets.token_urlsafe(24)); TOKEN_FILE.chmod(0o600)
TOKEN = TOKEN_FILE.read_text().strip()
SCRIPT = Path(os.environ['SPECTRA_SEPARATOR'])
MODEL = hashlib.sha256(SCRIPT.read_bytes()).hexdigest()
STEMS = ['vocals', 'drums', 'bass', 'piano', 'synths', 'fx', 'other']
CHUNK = 6
MAX_BYTES = 256 * 1024 * 1024
LOCK = threading.RLock()
POOL = concurrent.futures.ThreadPoolExecutor(max_workers=1)
JOBS = {}
UPLOADS = {}
FAILURES = {}
for p in ROOT.glob('jobs/*/job.json'):
    try:
        j = json.loads(p.read_text())
        if j['status'] not in ('ready', 'error'): j.update(status='error', error='Mac service restarted. Upload the song again to retry.')
        JOBS[j['id']] = j
    except (ValueError, KeyError): pass

def persist(j):
    folder = ROOT / 'jobs' / j['id']; folder.mkdir(parents=True, exist_ok=True)
    tmp = folder / 'job.tmp'; tmp.write_text(json.dumps(j)); tmp.replace(folder / 'job.json')

def process(jid):
    j = JOBS[jid]; folder = ROOT / 'jobs' / jid
    try:
        j.update(status='separating', progress=0.01); persist(j)
        with (folder / 'engine.log').open('w') as log:
            child = subprocess.Popen([sys.executable, str(SCRIPT), str(folder / 'input.wav'), str(folder / 'stems')], stdout=subprocess.PIPE, stderr=log, text=True, env={**os.environ, 'PYTORCH_ENABLE_MPS_FALLBACK':'1', 'OMP_NUM_THREADS':'4'})
            for line in child.stdout:
                if line.startswith('SPECTRA_PROGRESS '):
                    j['progress'] = min(.9, float(line.split()[1]) * .9)
            if child.wait(): raise RuntimeError('Separation failed. The Mac engine log has details.')
        j.update(status='preparing', progress=.91)
        rate = int(j['sampleRate']); frames = int(j['frames'])
        # Preserve the plugin contract: exact source length and rate, 24-bit exports.
        from scipy.signal import resample_poly
        from math import gcd
        for name in STEMS:
            src = folder / 'stems' / f'{name}.wav'
            data, sr = sf.read(src, dtype='float32', always_2d=True)
            if sr != rate:
                d = gcd(sr, rate); data = resample_poly(data, rate//d, sr//d, axis=0)
            data = data[:frames]
            if len(data) < frames: data = np.pad(data, ((0, frames-len(data)), (0,0)))
            sf.write(src, data, rate, subtype='PCM_24')
        chunks = folder / 'chunks'; chunks.mkdir(exist_ok=True)
        readers = [sf.SoundFile(folder / 'stems' / f'{s}.wav') for s in STEMS]
        try:
            for index in range(math.ceil(j['duration']/CHUNK)):
                blocks=[]
                for reader in readers:
                    pcm = reader.read(rate*CHUNK, dtype='float32', always_2d=True)
                    out=io.BytesIO(); sf.write(out, pcm, rate, format='FLAC', subtype='PCM_24'); blocks.append(out.getvalue())
                (chunks / f'{index}.bin').write_bytes(struct.pack('<7I', *map(len,blocks)) + b''.join(blocks))
                j['progress'] = .91 + .09 * (index+1)/math.ceil(j['duration']/CHUNK)
        finally:
            for r in readers: r.close()
        j.update(status='ready', progress=1, stems=STEMS, chunkSeconds=CHUNK); persist(j)
    except Exception as e:
        j.update(status='error', error=str(e)[:200]); persist(j)

class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def log_message(self, *args): pass
    def headers_out(self, code, length, typ='application/json'):
        self.send_response(code)
        origin=self.headers.get('Origin','')
        if origin in ('https://gusvega.dev','https://3d.gusvega.dev','http://localhost:3018','http://127.0.0.1:3018'):
            self.send_header('Access-Control-Allow-Origin',origin)
        self.send_header('Vary','Origin')
        self.send_header('Access-Control-Allow-Headers','Authorization, Content-Type')
        self.send_header('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Type',typ); self.send_header('Content-Length',str(length)); self.end_headers()
    def respond(self, value, code=200):
        b=json.dumps(value).encode(); self.headers_out(code,len(b)); self.wfile.write(b)
    def auth(self):
        ip=self.headers.get('CF-Connecting-IP', self.client_address[0]); now=time.time()
        with LOCK:
            failures=[t for t in FAILURES.get(ip,[]) if now-t<60]
            if len(failures)>=15: self.respond({'error':'Try again in a minute.'},429); return False
            if not hmac.compare_digest(self.headers.get('Authorization',''), 'Bearer '+TOKEN):
                FAILURES[ip]=failures+[now]; self.respond({'error':'Enter your SPECTRA access key.'},401); return False
        return True
    def body(self, limit=8192):
        n=int(self.headers.get('Content-Length','0'))
        if n<1 or n>limit: raise ValueError('Request size is not supported.')
        self.connection.settimeout(60)
        data=self.rfile.read(n)
        if len(data)!=n: raise ValueError('Upload interrupted. Please retry.')
        return data
    def do_OPTIONS(self): self.headers_out(204,0)
    def do_GET(self):
        if not self.auth(): return
        parts=urlparse(self.path).path.strip('/').split('/')
        if parts==['health']: return self.respond({'online':True,'engine':'SPECTRA','chunkSeconds':CHUNK})
        if parts==['jobs']: return self.respond({'jobs':sorted(JOBS.values(),key=lambda j:j['created'],reverse=True)})
        if len(parts)>=2 and parts[0]=='jobs' and parts[1] in JOBS:
            j=JOBS[parts[1]]; folder=ROOT/'jobs'/j['id']
            if len(parts)==2: return self.respond(j)
            if j['status']=='ready' and len(parts)==4:
                if parts[2]=='chunks' and parts[3].isdigit() and int(parts[3])<math.ceil(j['duration']/CHUNK):
                    file=folder/'chunks'/f'{int(parts[3])}.bin'; typ='application/octet-stream'
                elif parts[2]=='stems' and parts[3] in STEMS:
                    file=folder/'stems'/f'{parts[3]}.wav'; typ='audio/wav'
                else: return self.respond({'error':'Not found'},404)
                self.headers_out(200,file.stat().st_size,typ)
                with file.open('rb') as f: shutil.copyfileobj(f,self.wfile,1024*1024)
                return
        self.respond({'error':'Not found'},404)
    def do_DELETE(self):
        if not self.auth(): return
        p=urlparse(self.path).path
        match=re.fullmatch(r'/jobs/([a-f0-9]{32})',p)
        with LOCK:
            if not match or match[1] not in JOBS: return self.respond({'error':'Not found'},404)
            j=JOBS[match[1]]
            if j['status'] not in ('ready','error'): return self.respond({'error':'Wait for analysis to finish.'},409)
            shutil.rmtree(ROOT/'jobs'/j['id']); del JOBS[j['id']]
        self.respond({'deleted':True})
    def do_PUT(self):
        if not self.auth(): return
        try:
            p=urlparse(self.path); uid=p.path.split('/')[-1]
            if uid not in UPLOADS: return self.respond({'error':'Upload expired'},404)
            with LOCK:
                u=UPLOADS[uid]; offset=int(parse_qs(p.query).get('offset',['-1'])[0])
                if offset!=u['received']: return self.respond({'error':'Upload offset mismatch'},409)
                data=self.body(4*1024*1024)
                if u['received']+len(data)>u['size']: raise ValueError('File exceeds declared size')
                with (ROOT/'uploads'/uid).open('ab') as f: f.write(data)
                u['received']+=len(data)
            self.respond({'received':u['received']})
        except (ValueError, OSError) as e: self.respond({'error':str(e)},400)
    def do_POST(self):
        if not self.auth(): return
        try:
            p=urlparse(self.path).path
            data=json.loads(self.body())
            if p=='/uploads':
                size=int(data['size'])
                if not 1<=size<=MAX_BYTES: raise ValueError('Choose an audio file under 256 MB.')
                with LOCK:
                    for uid,u in list(UPLOADS.items()):
                        if time.time()-u['created']>3600:
                            (ROOT/'uploads'/uid).unlink(missing_ok=True); del UPLOADS[uid]
                    if len(UPLOADS)>=3 or sum(j['status'] not in ('ready','error') for j in JOBS.values())>=3:
                        return self.respond({'error':'Please wait for the current uploads or analyses.'},429)
                    if shutil.disk_usage(ROOT).free < 5*1024**3: raise ValueError('Mac storage is low.')
                    if len(JOBS)>=8 or sum(p.stat().st_size for p in (ROOT/'jobs').rglob('*') if p.is_file())>12*1024**3:
                        raise ValueError('Library is full. Remove an older song before uploading.')
                    uid=uuid.uuid4().hex; (ROOT/'uploads').mkdir(exist_ok=True)
                    UPLOADS[uid]={'size':size,'received':0,'name':str(data.get('name','Audio'))[:120],'created':time.time()}
                return self.respond({'id':uid})
            match=re.fullmatch(r'/uploads/([a-f0-9]{32})/finish',p)
            if not match or match[1] not in UPLOADS: return self.respond({'error':'Upload not found'},404)
            uid=match[1]; u=UPLOADS[uid]; source=ROOT/'uploads'/uid
            if u['received']!=u['size']: raise ValueError('Upload is incomplete.')
            try:
                info=sf.info(source)
                if not 0<info.duration<=600: raise ValueError('The proof of concept supports songs up to 10 minutes.')
                if info.channels>2 or info.samplerate>192000: raise ValueError('Choose mono or stereo audio up to 192 kHz.')
                digest=hashlib.sha256(MODEL.encode())
                with source.open('rb') as f:
                    for block in iter(lambda:f.read(1024*1024),b''): digest.update(block)
                key=digest.hexdigest()
                for j in JOBS.values():
                    if j.get('hash')==key and j['status']!='error': return self.respond(j)
                pcm,rate=sf.read(source,dtype='float32',always_2d=True)
                if not np.isfinite(pcm).all(): raise ValueError('Audio contains invalid samples.')
                if pcm.shape[1]==1: pcm=np.repeat(pcm,2,axis=1)
                jid=uuid.uuid4().hex; folder=ROOT/'jobs'/jid; folder.mkdir(parents=True)
                sf.write(folder/'input.wav',pcm,rate,subtype='FLOAT')
                peaks=[round(float(np.max(np.abs(x))),4) for x in np.array_split(pcm,min(180,len(pcm)))]
                j={'id':jid,'name':u['name'],'status':'queued','progress':0,'created':time.time(),'duration':len(pcm)/rate,'frames':len(pcm),'sampleRate':rate,'hash':key,'peaks':peaks}
                JOBS[jid]=j; persist(j); POOL.submit(process,jid); self.respond(j)
            finally:
                source.unlink(missing_ok=True); UPLOADS.pop(uid,None)
        except Exception as e: self.respond({'error':str(e)[:200]},400)

if __name__=='__main__':
    ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('SPECTRA_PORT','8768'))),Handler).serve_forever()
