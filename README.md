# Sound & space — UCL

Onepage em inglês para o experimento do módulo BENV0008 25/26. Construída sobre esta base Astro, com JavaScript apenas para áudio e gráficos D3.

## Clonar

```sh
git clone https://github.com/aera-company/sound-space.git
cd sound-space
```

As versões atuais X3 dos MP3 estão diretamente no Git (30,6 e 34,5 MB), sem depender de Git LFS no checkout ou no build. O histórico inicial conserva os ponteiros LFS das versões anteriores; não é necessário baixar esses arquivos para executar a página atual.

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

O build estático é gerado em `dist/`. O site publicado é https://sound-space-one.vercel.app, com deploy a partir de `main`.

## Conteúdo

- `src/components/ListeningRoom.astro`: duas condições, um player completo e análise.
- `src/components/Research.astro`: cena interativa das quatro condições, overview, vídeo, medidores e metodologia.
- `src/scripts/experiment.ts`: legendas e reprodução do vídeo ao entrar em tela.
- `public/video/lighting.mp4`: vídeo com a faixa de áudio removida e faststart; VTT com condições de luz.
- `src/scripts/audio.ts`: reprodução exclusiva, volume, repetição, busca e gráficos.
- `src/scripts/spectrum.ts`: FFT ao vivo, suavização, resolução, picos e leitura de frequências.
- `src/styles/global.css`: identidade editorial e responsividade.
- `src/data/68.json` e `118.json`: medidas reais dos arquivos completos.
- `public/audio/`: cópias inalteradas dos MP3 X3 fornecidos, sem normalização.
- `public/analysis/`: espectrogramas previamente calculados.
- `scripts/analyze_audio.py`: regeneração reprodutível das medidas e espectrogramas.
- `docs/`: direção criativa, verificação e resultados dos testes.

## Atualizar as músicas

Substitua as cópias em `public/audio/68-x3.mp3` e `public/audio/118-x3.mp3`, execute `scripts/analyze_audio.py` com Python + NumPy + Pillow, com FFmpeg e FFprobe no PATH, e reconstrua o site. Os BPMs são identificadores fornecidos pelo projeto, não estimativas automáticas.

As faixas X3 têm 12:44,760 (68 BPM) e 14:22,440 (118 BPM), com aproximadamente 29,2 e 32,9 MiB. `preload="none"` evita baixá-los na abertura; os gráficos usam dados calculados previamente. Para publicar, o serviço de hospedagem precisa servir arquivos grandes com HTTP Range. Se os áudios forem movidos para outro domínio, configure CORS e o atributo `crossorigin` antes de utilizar Web Audio. Nenhum domínio foi presumido para canonical.

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

## Fotografias, vídeo e amostras

A paleta foi amostrada do cartão palette.jpg: dark purple #331c52, off white #fbf9fc, paper white #ffffff, bright purple #8e45f6, heritage blue #86d4fb, pale purple #ebdefc, light purple #d7bdfa e mid purple #b384f8. A paleta quantitativa do espectrograma continua black/violet/red/yellow, como na referência específica desse gráfico.

A hero foi reorganizada como uma capa acadêmica digital a partir da capa fornecida: título completo da pesquisa, subtítulo do piloto, módulo, código do estudante, programa, instituto e supervisores. A fotografia da loja mantém o enquadramento horizontal amplo, com um degradê branco vertical prolongado para receber o texto. As fotos originais permanecem sem filtros de cor. A visão geral e os números de respondentes vêm de experimentar overview.jpg. A fotografia dos medidores documenta o método e não é usada como medida representativa de todo o experimento.

Cada cartão da cena experimental toca o intervalo 0:30–1:00 da faixa X3 correspondente, com um único player. As duas condições que usam o mesmo BPM usam o mesmo trecho. Novo clique, Stop excerpt ou o fim de 30 segundos interrompem o trecho. O player principal pode continuar a gravação completa.

O vídeo de 53,9 s foi remuxado sem áudio, sem recompressão visual, com faststart. Legendas de luz em experiment.ts e lighting.vtt foram alinhadas por inspeção do filme (aproximadamente 0,1 s); são descrições visuais, não medidas de CCT. Ele toca mudo, inline, quando visível; pausa fora de tela e permite pausa/busca manual. Com reduced motion, aguarda play.

Verificação desta revisão: scripts/verify-media.cjs (desktop e WebKit mobile, resultados em docs/media-results.json) e scripts/verify-unified.cjs para os controles completos do analisador.

## Overview em Remotion

A imagem de baixa resolução foi recriada como arte vetorial a partir dos mesmos quatro grupos, datas e números de respondentes. A composição em `motion/overview` gera um MP4 de 8 segundos (1920 × 1680, 30 fps) e o SVG estático, ambos a partir do mesmo componente React. Consulte o README desse diretório para regenerar. A página não carrega React ou Remotion: usa vídeo nativo e SVG.

O overview destaca cada condição uma vez ao entrar em tela, permite pausa e replay e respeita reduced motion. Uma tabela HTML oferece os mesmos dados. Os cartões da cena experimental mostram o progresso real do trecho; navegação, seletores e aberturas têm transições discretas, com foco por teclado preservado.
