# Sound & space — UCL

Onepage em inglês para o experimento do módulo BENV0008 25/26. Construída sobre esta base Astro, com JavaScript apenas para áudio e gráficos D3.

## Clonar com os áudios completos

Os MP3 são versionados com **Git LFS**. Instale o Git LFS antes de clonar:

```sh
git lfs install
git clone https://github.com/aera-company/sound-space.git
cd sound-space
git lfs pull
```

No ambiente de build, confirme que o checkout baixa os objetos LFS antes de executar o Astro; os arquivos em `public/audio/` precisam ser os MP3 completos, não apenas os ponteiros LFS.

## Executar

```sh
npm ci
npm run dev
```

A prévia padrão abre em `http://localhost:4321`.

```sh
npm run build
npm run preview
```

O build estático é gerado em `dist/`. Não foi publicado nesta etapa.

## Conteúdo

- `src/components/ListeningRoom.astro`: duas condições, um player completo e análise.
- `src/components/Research.astro`: luz × música, fotos, metodologia e créditos.
- `src/scripts/audio.ts`: reprodução exclusiva, volume, repetição, busca e gráficos.
- `src/scripts/spectrum.ts`: FFT ao vivo, suavização, resolução, picos e leitura de frequências.
- `src/styles/global.css`: identidade editorial e responsividade.
- `src/data/68.json` e `118.json`: medidas reais dos arquivos completos.
- `public/audio/`: cópias dos MP3 originais, sem processamento ou normalização.
- `public/analysis/`: espectrogramas previamente calculados.
- `scripts/analyze_audio.py`: regeneração reprodutível das medidas e espectrogramas.
- `docs/`: direção criativa, verificação e resultados dos testes.

## Atualizar as músicas

Substitua as cópias em `public/audio/68.mp3` e `public/audio/118.mp3`, execute `scripts/analyze_audio.py` com Python + NumPy + Pillow, com FFmpeg e FFprobe no PATH, e reconstrua o site. Os BPMs são identificadores fornecidos pelo projeto, não estimativas automáticas.

Os arquivos completos têm aproximadamente 201 e 197 MiB. `preload="none"` evita baixá-los na abertura; os gráficos usam dados calculados previamente. Para publicar, o serviço de hospedagem precisa servir arquivos grandes com HTTP Range. Se os áudios forem movidos para outro domínio, configure CORS e o atributo `crossorigin` antes de utilizar Web Audio. Nenhum domínio foi presumido para canonical.

## Análise

Waveform: envelope RMS do mono em janelas de 5 s. FFT: janela Hann de 2.048 amostras, mono a 24 kHz, visualização logarítmica de 30 Hz a 12 kHz, potência média. Escala do espectrograma: −90 a −15 dBFS, igual nas duas versões. Estas visualizações de arquivo são agregadas para mostrar a gravação inteira. O modo Live spectrum é calculado separadamente durante a reprodução.

Loudness: FFmpeg EBU R128 sobre os MP3 estéreo originais, à taxa original. Curva short-term de 3 s agregada em janelas de 5 s, loudness integrado (LUFS), LRA (LU) e true peak (dBTP). As medidas não mudam com o volume do player. Repetição usa o loop nativo: não certifica emenda imperceptível.

O estudo é exploratório. Mood descreve intenção musical, não resultados de participantes. Cor na interface representa a combinação experimental, sem simular iluminação calibrada. Dados acústicos dos arquivos não equivalem ao SPL da loja.

## Fontes e autoria

Contexto e imagens extraídos das apresentações de junho e agosto de 2026 fornecidas na pasta de trabalho. Identificação exibida: BENV0008 25/26; orientação: Dr Francesco Aletta e Dr Gemma Moore; UCL IEDE. Os créditos musicais identificam os arquivos fornecidos; nome de compositor/produtor não foi presumido.

## Player único e espectro ao vivo

Uma única área de reprodução controla a gravação selecionada, com play/pause, minutagem, busca por teclado, volume e repetição. Trocar de condição durante a reprodução passa o áudio para a outra gravação. Waveform, spectrogram e loudness mantêm playheads e busca por clique/arraste. A comparação usa as mesmas escalas para os dois arquivos.

Frequencies abre em Live spectrum: Web Audio AnalyserNode com janela Blackman, FFT de 4.096 amostras por padrão, opções 2.048/8.192, escala logarítmica 20 Hz–20 kHz (limitada por Nyquist), faixa −120 a 0 dBFS e smoothingTimeConstant 0,08 (Fast), 0,35 ou 0,75. Canvas atualiza aproximadamente 30 vezes por segundo durante playback e reduz a cadência com reduced motion. O pico retido decai 8 dB/s. Freeze congela o gráfico sem interromper a música. Pausar mantém a última leitura; trocar de gravação ou buscar limpa a leitura anterior.

O grafo é MediaElementSource → Analyser → Gain → saída. O volume fica depois da análise, portanto silenciar a saída preserva o sinal medido. Não há captura de microfone. File average mantém as curvas médias das gravações completas e permite comparar ambas. As janelas e agregações do espectro ao vivo e da média de arquivo diferem; valores não são diretamente intercambiáveis.

Os dados `*-segments.json` preservados em public/analysis são produtos da análise offline e não são carregados pelo player atual. A cor do espectrograma segue a referência black/violet/red/yellow na escala comum documentada.

Verificação atual: `NODE_PATH=/path/to/runtime/node_modules node scripts/verify-unified.cjs`, com Playwright Chromium e WebKit e a prévia em `http://127.0.0.1:4322`. Resultado em `docs/unified-results.json`.
