"use client";

import { useEffect, useRef, useState } from "react";
import { fetchManifest } from "@/lib/fetchManifest";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings,
  RotateCcw
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { QualityOption } from "@/types";

type PlayerProps = {
  mediaId: string;
};

type Manifest = {
  id: string;
  title: string;
  duration?: number;
  qualities: Record<string, { url: string; segments: number } | string>;
};

const qualityOptions: QualityOption[] = [
  { value: "96k", label: "Baixa (96k)", bitrate: "96 kbps" },
  { value: "160k", label: "Média (160k)", bitrate: "160 kbps" },
  { value: "320k", label: "Alta (320k)", bitrate: "320 kbps" },
];

export function PlayerSimple({ mediaId }: PlayerProps) {
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
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Função utilitária para validar valores de tempo
  const safeSetDuration = (value: number) => {
    if (isFinite(value) && value > 0 && value < 86400) { // max 24h
      setDuration(value);
    } else {
      console.warn(`⚠️ Duração inválida rejeitada: ${value}`);
    }
  };

  const safeSetCurrentTime = (value: number) => {
    if (isFinite(value) && value >= 0) {
      setCurrentTime(value);
    }
  };

  const safeSetBuffered = (value: number) => {
    if (isFinite(value) && value >= 0) {
      setBuffered(value);
    }
  };

  // Fetch manifest
  useEffect(() => {
    async function loadManifest() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchManifest(mediaId);
        setManifest(data);
        
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

  // Player principal - versão simplificada
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


    // Event listeners
    const handleTimeUpdate = () => safeSetCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        safeSetDuration(audio.duration);
      }
    };
    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        safeSetBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);
    const handleError = () => setError("Erro ao carregar áudio");
    const handleLoadedMetadata = () => {
      // Usar duração do manifest se disponível e válida, senão usar a do áudio
      if (manifest.duration && manifest.duration > 0 && manifest.duration < 86400) { // max 24h
        safeSetDuration(manifest.duration);
      } else if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        safeSetDuration(audio.duration);
      } else {
        console.warn('⚠️ Nenhuma duração válida encontrada');
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Carregar áudio
    const loadAudio = async () => {
      try {
        const quality = manifest.qualities[currentQuality];
        const qualityInfo = quality as any;
        const baseUrl = (qualityInfo && typeof qualityInfo === 'object' && qualityInfo.url) 
          ? qualityInfo.url 
          : quality;

        // Tentar arquivo concatenado primeiro
        const concatenatedUrl = `${baseUrl}full.m4a`;
        
        try {
          const testResponse = await fetch(concatenatedUrl, { method: 'HEAD' });
          if (testResponse.ok) {
            audio.src = concatenatedUrl;
            audio.load();
            return;
          }
        } catch (e) {
          console.log("ℹ️ Arquivo concatenado não disponível");
        }

        // Fallback: carregar todos os segmentos e criar blob completo
        setLoadingSegments(true);
        setLoadingProgress(0);
        await loadAllSegments(baseUrl);

      } catch (error) {
        console.error("Erro ao carregar áudio:", error);
        setError("Erro ao carregar áudio");
      } finally {
        setLoadingSegments(false);
        setLoadingProgress(0);
      }
    };

    const loadAllSegments = async (baseUrl: string) => {
      try {
        let segmentIndex = 0;
        const audioChunks: Uint8Array[] = [];
        let hasMore = true;

        // Carregar todos os segmentos
        while (hasMore && segmentIndex < 200) {
          const segmentUrl = `${baseUrl}segment-${String(segmentIndex).padStart(3, "0")}.m4a`;
          
          try {
            const response = await fetch(segmentUrl);
            if (!response.ok) {
              if (response.status === 404) {
                hasMore = false;
                break;
              }
              throw new Error(`HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            audioChunks.push(new Uint8Array(arrayBuffer));
            
            // Atualizar progresso
            setLoadingProgress(Math.min(90, (segmentIndex + 1) * 2));
            segmentIndex++;

          } catch (error) {
            console.error(`❌ Erro no segmento ${segmentIndex}:`, error);
            if (segmentIndex === 0) {
              throw new Error("Não foi possível carregar áudio");
            }
            hasMore = false;
          }
        }

        if (audioChunks.length === 0) {
          throw new Error("Nenhum segmento foi carregado");
        }

        // Criar blob completo
        setLoadingProgress(95);
        
        const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        
        audioChunks.forEach(chunk => {
          combined.set(chunk, offset);
          offset += chunk.length;
        });

        const blob = new Blob([combined], { type: 'audio/mp4' });
        const audioUrl = URL.createObjectURL(blob);
        
        setLoadingProgress(100);
        
        audio.src = audioUrl;
        audio.load();
        
        // Cleanup após uso
        setTimeout(() => {
          URL.revokeObjectURL(audioUrl);
        }, 300000);

      } catch (error) {
        console.error("Erro ao carregar segmentos:", error);
        throw error;
      }
    };

    loadAudio();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [manifest, currentQuality]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch(error => {
        console.error("Erro ao reproduzir:", error);
        setError("Erro ao iniciar reprodução");
      });
    } else {
      audio.pause();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setVolume(newVolume);
    audio.volume = newVolume;
    setMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (muted) {
      audio.volume = volume;
      setMuted(false);
    } else {
      audio.volume = 0;
      setMuted(true);
    }
  };

  const changeQuality = (quality: string) => {
    setCurrentQuality(quality);
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    safeSetCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return "0:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    
    // Para debug - se a duração for muito estranha
    if (time > 3600) { // mais de 1 hora
      console.warn(`⚠️ Duração suspeita: ${time}s (${minutes}:${seconds.toString().padStart(2, '0')})`);
    }
    
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
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">❌ {error}</div>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!manifest) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6 text-center">
          <div>Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  const availableQualities = getAvailableQualities();
  const progressPercentage = (duration > 0 && isFinite(duration) && isFinite(currentTime)) 
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) 
    : 0;
  const bufferedPercentage = (duration > 0 && isFinite(duration) && isFinite(buffered)) 
    ? Math.min(100, Math.max(0, (buffered / duration) * 100)) 
    : 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{manifest.title}</span>
          <Badge variant="secondary">
            {availableQualities.find(q => q.value === currentQuality)?.bitrate || currentQuality}
          </Badge>
        </CardTitle>
        <CardDescription>Streaming de áudio - Qualidade: {currentQuality}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <audio ref={audioRef} />
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div 
            className="relative w-full h-2 bg-muted rounded-full cursor-pointer"
            onClick={(e) => {
              const audio = audioRef.current;
              if (!audio || !duration || !isFinite(duration) || duration <= 0) return;
              
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percentage = clickX / rect.width;
              const newTime = percentage * duration;
              
              if (isFinite(newTime) && newTime >= 0 && newTime <= duration) {
                audio.currentTime = newTime;
                safeSetCurrentTime(newTime);
              }
            }}
          >
            {/* Buffered */}
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
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-1">
              Current: {currentTime.toFixed(1)}s | Duration: {duration.toFixed(1)}s | Manifest: {manifest.duration?.toFixed(1)}s
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button size="lg" onClick={togglePlayPause} className="rounded-full">
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            <Button size="sm" variant="outline" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={toggleMute}>
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
                <DropdownMenuContent align="end">
                  {availableQualities.map((quality) => (
                    <DropdownMenuItem
                      key={quality.value}
                      onClick={() => changeQuality(quality.value)}
                      className={currentQuality === quality.value ? "bg-accent" : ""}
                    >
                      {quality.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Indicador de carregamento de segmentos */}
        {loadingSegments && (
          <div className="mt-3 px-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>🎵 Carregando áudio completo...</span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-center">
              {loadingProgress < 90 ? 'Baixando segmentos...' : 
               loadingProgress < 100 ? 'Montando áudio...' : 'Finalizando...'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}