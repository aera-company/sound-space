"""Reproducible analysis of the supplied masters. Requires FFmpeg, NumPy and Pillow.
Run with the Python runtime documented in docs/QA.md from the project root.
"""
import json, subprocess, re
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SR, FFT, STEP = 24000, 2048, 5
FREQS = np.geomspace(30, 12000, 192)

for bpm in (68, 118):
    source = ROOT / 'public' / 'audio' / f'{bpm}-x3.mp3'
    meta = json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(source)]))
    duration = float(meta['format']['duration'])
    print(f'Analysing {bpm} BPM: {duration:.2f}s', flush=True)
    proc = subprocess.Popen(['ffmpeg','-v','error','-i',str(source),'-ar',str(SR),'-ac','1','-f','f32le','-'], stdout=subprocess.PIPE)
    wave, rms, spectral = [], [], []
    window = np.hanning(FFT)
    fft_freqs = np.fft.rfftfreq(FFT, 1/SR)
    spectrum_sum = np.zeros(FFT//2+1)
    total_frames = 0
    while True:
        raw = proc.stdout.read(SR * STEP * 4)
        if not raw: break
        samples = np.frombuffer(raw, dtype='<f4')
        wave.append(round(float(np.max(np.abs(samples))),4))
        rms.append(round(float(20*np.log10(max(np.sqrt(np.mean(samples**2)),1e-6))),2))
        frames = samples[:len(samples)//FFT*FFT].reshape(-1,FFT)
        if len(frames) == 0: frames = np.pad(samples,(0,FFT-len(samples))).reshape(1,FFT)
        power = np.abs(np.fft.rfft(frames*window, axis=1)/(window.sum()/2))**2
        avg = power.mean(axis=0)
        spectrum_sum += power.sum(axis=0)
        total_frames += len(frames)
        spectral.append(10*np.log10(np.maximum(np.interp(FREQS,fft_freqs,avg),1e-10)))
    if proc.wait(): raise RuntimeError('Audio decoding failed')
    # Colour is a fixed, shared -90 to -15 dBFS FFT magnitude scale for both files.
    values = np.clip((np.array(spectral).T[::-1]+90)/75, 0, 1)
    stops = np.array([[0,0,0],[18,0,85],[95,0,165],[205,0,85],[255,35,0],[255,220,0],[255,255,205]])
    rgb = np.stack([np.interp(values,np.linspace(0,1,len(stops)),stops[:,c]) for c in range(3)],axis=-1).astype('uint8')
    Image.fromarray(rgb).save(ROOT/'public'/'analysis'/f'{bpm}-spectrogram.webp',quality=95)
    (ROOT/'public'/'analysis'/f'{bpm}-segments.json').write_text(json.dumps(dict(step=STEP,frequencies=FREQS.round(1).tolist(),segments=np.round(spectral,1).tolist()),separators=(',',':')))
    # EBU R128 runs on the ORIGINAL stereo signal at its original sample rate.
    print(f'Measuring EBU R128 for {bpm}',flush=True)
    result = subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(source),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
    summary = result.stderr.rsplit('Summary:',1)[1]
    integrated = float(re.search(r'I:\s*([-\d.]+) LUFS',summary)[1])
    lra = float(re.search(r'LRA:\s*([-\d.]+) LU',summary)[1])
    peak = float(re.search(r'Peak:\s*([-\d.]+) dBFS',summary)[1])
    short = [[] for _ in wave]
    for t,s in re.findall(r'\bt:\s*([\d.]+).*?\bS:\s*([-\d.]+)', result.stderr):
        if float(t)>=3: short[min(int(float(t)//STEP),len(short)-1)].append(float(s))
    loudness = [round(float(np.mean(s)),2) if s else None for s in short]
    spectrum = np.maximum(spectrum_sum/total_frames,1e-10)
    data = dict(bpm=bpm,duration=duration,sampleRate=int(meta['streams'][0]['sample_rate']),channels=2,
        step=STEP,waveform=wave,rms=rms,loudness=loudness,integrated=integrated,lra=lra,truePeak=peak,
        frequencies=FREQS.round(1).tolist(),spectrum=np.round(10*np.log10(np.interp(FREQS,fft_freqs,spectrum)),2).tolist(),
        analysis='Waveform: mono RMS / 5 s (peak values also retained). Spectrum: mean power, Hann 2048, mono 24 kHz, 30 Hz–12 kHz. Loudness: EBU R128 original stereo, short-term 3 s averaged in 5 s bins. No gain changes.')
    (ROOT/'src'/'data'/f'{bpm}.json').write_text(json.dumps(data,separators=(',',':')))
    print(json.dumps({k:data[k] for k in ['bpm','duration','integrated','lra','truePeak']}),flush=True)
