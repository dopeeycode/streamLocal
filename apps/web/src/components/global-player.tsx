"use client";

import { usePlayer } from '@/contexts/player-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cleanMediaTitle, cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  ChevronUp,
  ChevronDown,
  Settings,
  Music
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function GlobalPlayer() {
  const {
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    volume,
    quality,
    play,
    pause,
    seek,
    setVolume,
    setQuality,
    nextTrack,
    previousTrack,
    isMinimized,
    toggleMinimized
  } = usePlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // Ensure component only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close quality menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showQualityMenu) {
        setShowQualityMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showQualityMenu]);

  // Minimize player when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        playerRef.current && 
        !playerRef.current.contains(event.target as Node) &&
        !isMinimized
      ) {
        toggleMinimized();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMinimized, toggleMinimized]);

  // Don't render if no media is loaded or if not on client side
  if (!currentMedia || !isClient) return null;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    seek(time);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percent));
    setVolume(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = volume * 100;

  // Helper to show time even when duration is not yet loaded
  const displayDuration = duration > 0 ? duration : currentTime > 0 ? currentTime * 2 : 0; // Estimate if needed

  return (
    <div 
      ref={playerRef}
      className={cn(
        "fixed left-0 bottom-10 right-0 z-50 transition-all duration-300",
        isMinimized ? "h-20" : "bottom-24 h-36"
      )}
    >
      <Card className="rounded-none border-x-0 border-b-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-lg">
        <div className="px-4 py-4">
          {/* Minimized View */}
          {isMinimized && (
            <div className="flex items-center justify-between gap-4 py-1">
              {/* Track Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[60%]">
                <div className="w-10 h-10 rounded-lg bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{cleanMediaTitle(currentMedia.title)}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 cursor-pointer" onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenu(!showQualityMenu);
                    }}>
                      {quality}
                    </Badge>
                    <span>{formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}</span>
                  </div>
                </div>
              </div>

              {/* Mini Progress Bar */}
              <div className="flex-1 max-w-xs min-w-[200px]">
                <div 
                  className="h-1 bg-muted rounded-full cursor-pointer group"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-primary rounded-full transition-all relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousTrack}
                  className="h-8 w-8 p-0 hover:bg-muted/50"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={isPlaying ? pause : play}
                  className="h-9 w-9 p-0 rounded-full"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextTrack}
                  className="h-8 w-8 p-0 hover:bg-muted/50"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimized}
                  className="h-8 w-8 p-0 ml-2 hover:bg-muted/50"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              </div>

              {/* Quality Menu for minimized mode */}
              {showQualityMenu && (
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 bg-background border rounded-lg shadow-lg p-1 min-w-20 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(['96k', '160k', '320k'] as const).map((q) => (
                    <Button
                      key={q}
                      variant={quality === q ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-center text-xs h-7"
                      onClick={() => {
                        setQuality(q);
                        setShowQualityMenu(false);
                      }}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expanded View */}
          {!isMinimized && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base truncate">{cleanMediaTitle(currentMedia.title)}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Streaming de áudio</p>
                      <Badge variant="outline" className="text-xs">
                        {quality}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMinimized}
                  className="h-8 w-8 p-0 hover:bg-muted/50"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div 
                  className="h-2 bg-muted rounded-full cursor-pointer group"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-primary rounded-full transition-all relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border-2 border-background" />
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-2">
                {/* Playback Controls */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={previousTrack}
                    className="h-9 w-9 p-0 hover:bg-muted/50"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={isPlaying ? pause : play}
                    className="h-11 w-11 p-0 rounded-full"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextTrack}
                    className="h-9 w-9 p-0 hover:bg-muted/50"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="h-8 w-8 p-0 hover:bg-muted/50"
                  >
                    {isMuted || volume === 0 ? 
                      <VolumeX className="h-4 w-4" /> : 
                      <Volume2 className="h-4 w-4" />
                    }
                  </Button>
                  
                  <div 
                    className="w-28 h-2 bg-muted rounded-full cursor-pointer group"
                    onClick={handleVolumeChange}
                  >
                    <div 
                      className="h-full bg-primary rounded-full relative"
                      style={{ width: `${volumePercent}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-background" />
                    </div>
                  </div>
                </div>

                {/* Quality Control */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenu(!showQualityMenu);
                    }}
                    className="gap-2 h-9 px-3"
                  >
                    <Settings className="h-3 w-3" />
                    <span className="font-medium">{quality}</span>
                  </Button>
                  
                  {showQualityMenu && (
                    <div 
                      className="absolute bottom-full right-0 mb-2 bg-background border rounded-lg shadow-lg p-1 min-w-24 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(['96k', '160k', '320k'] as const).map((q) => (
                        <Button
                          key={q}
                          variant={quality === q ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-center text-xs h-8 font-medium"
                          onClick={() => {
                            setQuality(q);
                            setShowQualityMenu(false);
                          }}
                        >
                          {q}
                        </Button>
                      ))}
                      <div className="border-t mt-1 pt-1">
                        <p className="text-xs text-muted-foreground px-2 py-1 text-center">
                          Qualidade de áudio
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}