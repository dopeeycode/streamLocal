import { PlayerSimple } from './player-simple';

export function Player({ mediaId }: { mediaId: string }) {
  return <PlayerSimple mediaId={mediaId} />;
}

export default Player;
];

export function Player({ mediaId }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuality, setCurrentQuality] = useState("160k");
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  
  // Novas funcionalidades para streaming adaptativo
  const [networkQuality, setNetworkQuality] = useState<'fast' | 'medium' | 'slow'>('medium');
  const [autoQuality, setAutoQuality] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const networkMonitorRef = useRef<{ startTime: number; bytesLoaded: number } | null>(null);

  // Fetch manifest quando o componente montar
  useEffect(() => {
    async function loadManifest() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchManifest(mediaId);
        setManifest(data);
        
        // Definir qualidade padrão baseada nas disponíveis
        const availableQualities = Object.keys(data.qualities);
        if (availableQualities.includes("160k")) {
          setCurrentQuality("160k");
        } else if (availableQualities.length > 0) {
          setCurrentQuality(availableQualities[0]);
        }
      } catch (err) {
        setError("Erro ao carregar o manifest");
        console.error("Erro ao carregar manifest:", err);
      } finally {
        setLoading(false);
      }
    }

    loadManifest();
  }, [mediaId]);

  // Monitoramento de rede e adaptação automática de qualidade
  const measureNetworkSpeed = (bytesDownloaded: number, timeMs: number) => {
    const speedKbps = (bytesDownloaded * 8) / (timeMs / 1000) / 1000;
    setDownloadSpeed(speedKbps);
    
    let quality: 'fast' | 'medium' | 'slow';
    if (speedKbps > 1000) {
      quality = 'fast';
    } else if (speedKbps > 300) {
      quality = 'medium';
    } else {
      quality = 'slow';
    }
    
    setNetworkQuality(quality);
    
    // Auto-adaptação de qualidade
    if (autoQuality && manifest) {
      const optimalQuality = getOptimalQuality(quality);
      if (optimalQuality !== currentQuality) {
        console.log(`🔄 Auto-adaptação: ${currentQuality} → ${optimalQuality} (velocidade: ${speedKbps.toFixed(0)}kbps)`);
        setCurrentQuality(optimalQuality);
      }
    }
  };

  const getOptimalQuality = (networkQuality: 'fast' | 'medium' | 'slow'): string => {
    switch (networkQuality) {
      case 'fast':
        return '320k';
      case 'medium':
        return '160k';
      case 'slow':
        return '96k';
      default:
        return '160k';
    }
  };

  useEffect(() => {
    if (!manifest || !currentQuality) return;
    
    const audio = audioRef.current;
    if (!audio) return;

    // Reset states
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setPlaying(false);

    // Cleanup previous source
    if (audio.src) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    console.log(`🎵 Inicializando player para qualidade: ${currentQuality}`);

    // Event listeners
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        console.log(`⏱️ Duração detectada: ${audio.duration.toFixed(1)}s`);
      }
    };
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleError = (e: Event) => {
      const audioError = (e.target as HTMLAudioElement)?.error;
      console.error("Erro no elemento audio:", audioError);
      
      if (audioError) {
        switch (audioError.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            setError("Erro de rede ao carregar áudio");
            break;
          case MediaError.MEDIA_ERR_DECODE:
            setError("Erro ao decodificar áudio");
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            setError("Formato de áudio não suportado");
            break;
          default:
            setError("Erro desconhecido na reprodução");
        }
      }
    };
    const handleCanPlay = () => {
      console.log("✅ Áudio pronto para reprodução");
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleLoadedMetadata = () => {
      console.log("📊 Metadados carregados");
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        console.log(`⏱️ Duração final: ${audio.duration.toFixed(1)}s`);
      }
    };
    const handleLoadStart = () => {
      console.log("🔄 Iniciando carregamento do áudio");
      setLoadingProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);

    // Estratégia de streaming: tentar concatenated primeiro, depois fallback para segmentos
    const initializeAudio = async () => {
      try {
        const quality = manifest.qualities[currentQuality];
        const qualityInfo = quality as any;
        const baseUrl = (qualityInfo && typeof qualityInfo === 'object' && qualityInfo.url) 
          ? qualityInfo.url 
          : quality;

        console.log(`🎯 Inicializando áudio com baseUrl: ${baseUrl}`);

        // Estratégia 1: Tentar carregar arquivo concatenado (mais eficiente)
        const concatenatedUrl = `${baseUrl}full.m4a`;
        console.log(`🔍 Testando arquivo concatenado: ${concatenatedUrl}`);
        
        try {
          const testResponse = await fetch(concatenatedUrl, { 
            method: 'HEAD',
            cache: 'no-cache'
          });
          
          if (testResponse.ok && testResponse.headers.get('content-length')) {
            const contentLength = parseInt(testResponse.headers.get('content-length') || '0');
            if (contentLength > 1000) { // Arquivo deve ter pelo menos 1KB
              console.log(`✅ Usando arquivo concatenado (${(contentLength / 1024).toFixed(1)}KB)`);
              audio.src = concatenatedUrl;
              audio.load();
              return;
            }
          }
        } catch (e) {
          console.log(`ℹ️ Arquivo concatenado não disponível ou inválido`);
        }

        // Estratégia 2: Streaming por segmentos usando Blob URLs
        console.log(`🎬 Fallback para streaming por segmentos`);
        await streamSegments(baseUrl);

      } catch (error) {
        console.error("Erro ao inicializar áudio:", error);
        setError("Erro ao carregar áudio");
      }
    };

    const streamSegments = async (baseUrl: string) => {
      console.log("🎬 Iniciando streaming por segmentos");
      
      let segmentIndex = 0;
      const audioChunks: Uint8Array[] = [];
      let hasMore = true;
      let previewCreated = false;
      let totalBytesDownloaded = 0;
      const streamStartTime = Date.now();

      // Carregar todos os segmentos primeiro
      while (hasMore && segmentIndex < 200) { // Limite de segurança
        try {
          const segmentUrl = `${baseUrl}segment-${String(segmentIndex).padStart(3, "0")}.m4a`;
          const segmentStartTime = Date.now();
          
          console.log(`📦 Carregando segmento ${segmentIndex}: ${segmentUrl}`);
          const response = await fetch(segmentUrl);
          
          if (!response.ok) {
            if (response.status === 404) {
              console.log(`✅ Fim dos segmentos. Total carregado: ${segmentIndex} segmentos`);
              hasMore = false;
              break;
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          }

          const arrayBuffer = await response.arrayBuffer();
          const segmentTime = Date.now() - segmentStartTime;
          totalBytesDownloaded += arrayBuffer.byteLength;
          
          // Medir velocidade da rede
          if (segmentTime > 0) {
            measureNetworkSpeed(arrayBuffer.byteLength, segmentTime);
          }
          
          audioChunks.push(new Uint8Array(arrayBuffer));
          console.log(`✅ Segmento ${segmentIndex} carregado (${(arrayBuffer.byteLength / 1024).toFixed(1)}KB)`);
          
          // Atualizar progresso
          setLoadingProgress(Math.min(95, (segmentIndex + 1) * 2));
          
          segmentIndex++;

        } catch (error) {
          console.error(`❌ Erro no segmento ${segmentIndex}:`, error);
          if (segmentIndex === 0) {
            throw new Error("Não foi possível carregar o primeiro segmento");
          }
          
          // Se já carregou alguns segmentos, finalizar
          console.log(`⚠️ Finalizando com ${segmentIndex} segmentos devido a erro`);
          hasMore = false;
        }
      }

            // Criar áudio final com todos os segmentos carregados
      if (audioChunks.length === 0) {
        throw new Error("Nenhum segmento foi carregado");
      }

      console.log(`🔧 Montando áudio final com ${audioChunks.length} segmentos...`);
      setLoadingProgress(98);
      
      const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      
      audioChunks.forEach(chunk => {
        combined.set(chunk, offset);
        offset += chunk.length;
      });

      const blob = new Blob([combined], { type: 'audio/mp4' });
      const audioUrl = URL.createObjectURL(blob);
      
      console.log(`🎵 Áudio completo criado (${(totalLength / 1024 / 1024).toFixed(2)}MB)`);
      setLoadingProgress(100);
      
      // Configurar áudio
      audio.src = audioUrl;
      audio.load();
      
      // Cleanup após uso
      setTimeout(() => {
        URL.revokeObjectURL(audioUrl);
      }, 300000); // 5 minutos
    };

    initializeAudio();

    initializeAudio();

    return () => {

    const createFinalBlob = (chunks: Uint8Array[]) => {
      try {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        
        chunks.forEach(chunk => {
          combined.set(chunk, offset);
          offset += chunk.length;
        });

        const blob = new Blob([combined], { type: 'audio/mp4' });
        const finalUrl = URL.createObjectURL(blob);
        
        console.log(`🏁 Áudio completo montado com ${chunks.length} segmentos (${(totalLength / 1024 / 1024).toFixed(2)}MB)`);
        
        // Preservar estado atual se há preview tocando
        const currentTime = audio.currentTime || 0;
        const wasPlaying = !audio.paused;
        const currentVolume = audio.volume;
        
        // Substituir source
        audio.src = finalUrl;
        audio.load();
        
        // Restaurar estado quando metadados carregarem
        const restoreState = () => {
          if (currentTime > 0 && currentTime < audio.duration) {
            audio.currentTime = currentTime;
          }
          audio.volume = currentVolume;
          
          if (wasPlaying && currentTime > 0) {
            audio.play().catch(error => {
              console.warn("Não foi possível retomar reprodução automaticamente:", error);
            });
          }
        };

        audio.addEventListener('loadedmetadata', restoreState, { once: true });
        
        // Fallback se loadedmetadata não disparar
        setTimeout(() => {
          if (audio.readyState >= 1) { // HAVE_METADATA
            restoreState();
          }
        }, 1000);
        
        // Cleanup depois de um tempo
        setTimeout(() => {
          URL.revokeObjectURL(finalUrl);
        }, 300000); // 5 minutos
        
      } catch (error) {
        console.error("Erro ao criar áudio final:", error);
        setError("Erro ao processar áudio completo");
      }
    };

    initializeAudio();

    return () => {
      console.log("🧹 Limpando player");
      
      // Remove event listeners
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      
      // Cleanup audio
      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [manifest, currentQuality])

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setMuted(!muted);
    audio.muted = !muted;
  };

  const handleVolumeChange = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setVolume(value);
    audio.volume = value;
    if (value === 0) {
      setMuted(true);
      audio.muted = true;
    } else if (muted) {
      setMuted(false);
      audio.muted = false;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const newTime = clickRatio * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeQuality = (newQuality: string) => {
    if (!manifest?.qualities[newQuality]) return;
    
    const audio = audioRef.current;
    const currentTimeBackup = audio?.currentTime || 0;
    
    setCurrentQuality(newQuality);
    
    // Tentar manter a posição atual após a mudança
    setTimeout(() => {
      if (audio && currentTimeBackup > 0) {
        audio.currentTime = currentTimeBackup;
      }
    }, 1000);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAvailableQualities = () => {
    if (!manifest) return [];
    return qualityOptions.filter(option => 
      manifest.qualities[option.value]
    );
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-lg">Carregando player...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Erro no Player</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              // Recarregar o player
              window.location.reload();
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando informações do áudio...</p>
        </div>
      </div>
    );
  }

  const availableQualities = getAvailableQualities();
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{manifest.title}</CardTitle>
            <CardDescription>
              Streaming de áudio - Qualidade: {currentQuality}
            </CardDescription>
          </div>
          
          <Badge variant="outline">
            {availableQualities.find(q => q.value === currentQuality)?.bitrate}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Player de áudio oculto */}
        <audio ref={audioRef} preload="metadata" />
        
        {/* Barra de progresso */}
        <div className="space-y-2">
          <div 
            className="relative h-2 bg-muted rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            {/* Buffer */}
            <div 
              className="absolute top-0 left-0 h-full bg-muted-foreground/30 rounded-full"
              style={{ width: `${bufferedPercentage}%` }}
            />
            {/* Progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="lg"
              onClick={togglePlayPause}
              className="rounded-full"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={restart}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
            >
              {muted || volume === 0 ? 
                <VolumeX className="h-4 w-4" /> : 
                <Volume2 className="h-4 w-4" />
              }
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={muted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20"
            />

            {availableQualities.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">Qualidade de Áudio</div>
                  
                  <DropdownMenuItem
                    onClick={() => setAutoQuality(!autoQuality)}
                    className={autoQuality ? "bg-accent" : ""}
                  >
                    <div className="flex flex-col">
                      <span>🤖 Automático</span>
                      <span className="text-xs text-muted-foreground">
                        {autoQuality ? `Ativo (${currentQuality})` : 'Desativado'}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  
                  <div className="border-t border-border my-1"></div>
                  
                  {availableQualities.map((quality) => (
                    <DropdownMenuItem
                      key={quality.value}
                      onClick={() => {
                        setAutoQuality(false);
                        changeQuality(quality.value);
                      }}
                      className={currentQuality === quality.value && !autoQuality ? "bg-accent" : ""}
                    >
                      <div className="flex flex-col">
                        <span>{quality.label}</span>
                        <span className="text-xs text-muted-foreground">{quality.bitrate}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  
                  <div className="border-t border-border my-1"></div>
                  
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Rede:</span>
                      <span className={`${
                        networkQuality === 'fast' ? 'text-green-500' :
                        networkQuality === 'medium' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {networkQuality === 'fast' ? '🟢 Rápida' :
                         networkQuality === 'medium' ? '🟡 Média' : '🔴 Lenta'}
                      </span>
                    </div>
                    {downloadSpeed > 0 && (
                      <div className="flex justify-between">
                        <span>Velocidade:</span>
                        <span>{downloadSpeed.toFixed(0)} kbps</span>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Informações adicionais de streaming */}
        {loadingProgress > 0 && loadingProgress < 100 && (
          <div className="mt-3 px-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Carregando segmentos...</span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
