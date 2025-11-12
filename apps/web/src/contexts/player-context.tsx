"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { Media } from '@/types';

interface PlayerState {
  // Current media
  currentMedia: Media | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  quality: '96k' | '160k' | '320k';
  
  // Queue management
  playlist: Media[];
  currentIndex: number;
  
  // Player controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setQuality: (quality: '96k' | '160k' | '320k') => void;
  
  // Media management
  loadMedia: (media: Media) => void;
  setCurrentMedia: (media: Media) => void;
  setPlaylist: (playlist: Media[], startIndex?: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  
  // UI state
  isMinimized: boolean;
  toggleMinimized: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

// Cache keys for localStorage
const CACHE_KEYS = {
  LAST_MEDIA: 'streamLocal_lastMedia',
  LAST_POSITION: 'streamLocal_lastPosition',
  LAST_VOLUME: 'streamLocal_lastVolume',
  LAST_QUALITY: 'streamLocal_lastQuality',
  IS_MINIMIZED: 'streamLocal_isMinimized'
};

// Helper functions for localStorage
const saveToCache = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to cache:', error);
  }
};

const loadFromCache = (key: string, defaultValue: any = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from cache:', error);
    return defaultValue;
  }
};

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // Initialize with safe defaults for SSR
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [quality, setQualityState] = useState<'96k' | '160k' | '320k'>('160k');
  const [playlist, setPlaylistState] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [pendingSeekTime, setPendingSeekTime] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudioUrl = (media: Media, quality: string) => {
    // Use the backend server route with proper MIME type support
    return `http://localhost:3333/media/${media.id}/audio/${quality}`;
  };

  // Hydrate from cache after client-side mount
  useEffect(() => {
    // Load cached data only on client side
    const cachedMedia = loadFromCache(CACHE_KEYS.LAST_MEDIA);
    const cachedPosition = loadFromCache(CACHE_KEYS.LAST_POSITION, 0);
    const cachedVolume = loadFromCache(CACHE_KEYS.LAST_VOLUME, 1);
    const cachedQuality = loadFromCache(CACHE_KEYS.LAST_QUALITY, '160k');
    const cachedMinimized = loadFromCache(CACHE_KEYS.IS_MINIMIZED, true);

    setVolumeState(cachedVolume);
    setQualityState(cachedQuality);
    setIsMinimized(cachedMinimized);
    
    // Load media after setting other states
    if (cachedMedia) {
      setCurrentMedia(cachedMedia);
      // Also restore cached duration if available
      const cachedDuration = loadFromCache(`streamLocal_duration_${cachedMedia.id}`, 0);
      if (cachedDuration > 0) {
        setDuration(cachedDuration);
      }
      
      if (cachedPosition > 0) {
        setCurrentTime(cachedPosition);
        setPendingSeekTime(cachedPosition);
      }
    }
    
    setIsHydrated(true);
  }, []);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      if (currentMedia) {
        saveToCache(`streamLocal_duration_${currentMedia.id}`, audio.duration);
      }
    });
    
    audio.addEventListener('timeupdate', () => {
      // Don't update time if we have a pending seek that hasn't been applied yet
      if (pendingSeekTime === null) {
        setCurrentTime(audio.currentTime);
      }
    });
    
    audio.addEventListener('ended', () => {
      nextTrack();
    });
    
    audio.addEventListener('play', () => {
      setIsPlaying(true);
    });
    
    audio.addEventListener('pause', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', (e) => {
      const audioError = audio.error;
      if (audioError) {
        console.error('Audio error details:', {
          code: audioError.code,
          message: audioError.message,
          mediaError: audioError
        });
        
        // Map error codes to user-friendly messages
        switch (audioError.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            console.error('Audio loading was aborted');
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            console.error('Network error while loading audio');
            break;
          case MediaError.MEDIA_ERR_DECODE:
            console.error('Audio decoding failed');
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.error('Audio format not supported');
            break;
          default:
            console.error('Unknown audio error');
        }
      } else {
        console.error('Audio error event:', e);
      }
      setIsPlaying(false);
    });

    
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  // Save to cache when values change (only after hydration)
  useEffect(() => {
    if (currentMedia && isHydrated) {
      saveToCache(CACHE_KEYS.LAST_MEDIA, currentMedia);
    }
  }, [currentMedia, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToCache(CACHE_KEYS.LAST_POSITION, currentTime);
    }
  }, [currentTime, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToCache(CACHE_KEYS.LAST_VOLUME, volume);
    }
  }, [volume, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToCache(CACHE_KEYS.LAST_QUALITY, quality);
    }
  }, [quality, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveToCache(CACHE_KEYS.IS_MINIMIZED, isMinimized);
    }
  }, [isMinimized, isHydrated]);

  // Save duration to cache when it changes
  useEffect(() => {
    if (isHydrated && duration > 0 && currentMedia) {
      saveToCache(`streamLocal_duration_${currentMedia.id}`, duration);
    }
  }, [duration, currentMedia, isHydrated]);

  // Apply volume changes to audio element
  useEffect(() => {
    if (audioRef.current && isHydrated) {
      audioRef.current.volume = volume;
    }
  }, [volume, isHydrated]);

  // Auto-load media when currentMedia is set during hydration (but not for quality changes)
  useEffect(() => {
    if (currentMedia && isHydrated && audioRef.current && !audioRef.current.src) {
      const url = getAudioUrl(currentMedia, quality);
      
      audioRef.current.src = url;
      audioRef.current.volume = volume;
      audioRef.current.load();
      
      // Don't minimize when restoring cached media
      // setIsMinimized(false); // Commented out to keep the cached minimized state
    }
  }, [currentMedia, isHydrated]); // Removed quality from dependencies

  // Restore last position when audio metadata is loaded
  useEffect(() => {
    if (!audioRef.current || !isHydrated) return;
    
    const audio = audioRef.current;
    
    const handleLoadedMetadata = () => {
      
      if (pendingSeekTime !== null && pendingSeekTime > 0 && pendingSeekTime < audio.duration) {
        audio.currentTime = pendingSeekTime;
        setPendingSeekTime(null);
      }
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentMedia, isHydrated]);


  const loadMedia = (media: Media, shouldMinimize = true) => {
    if (!audioRef.current) return;
    
    
    setCurrentMedia(media);
    setPendingSeekTime(null); // Clear any pending seek for new media
    const url = getAudioUrl(media, quality);
    
    audioRef.current.src = url;
    audioRef.current.volume = volume;
    audioRef.current.load(); // Force reload
    
    if (shouldMinimize) {
      setIsMinimized(false);
    }
  };

  const play = () => {
    if (audioRef.current && currentMedia) {
      audioRef.current.play()
        
        .catch((error) => {
          console.error('Playback failed:', error);
          setIsPlaying(false);
        });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const setQuality = (newQuality: '96k' | '160k' | '320k') => {
    if (!currentMedia || !audioRef.current) {
      setQualityState(newQuality);
      return;
    }

    const audio = audioRef.current;
    const currentTimeBackup = audio.currentTime;
    const wasPlaying = !audio.paused;
    
    
    // Pause first to avoid conflicts
    if (wasPlaying) {
      audio.pause();
    }
    
    // Set new quality state
    setQualityState(newQuality);
    
    // Load new URL
    const newUrl = getAudioUrl(currentMedia, newQuality);
    audio.src = newUrl;
    
    // Set up one-time listener for when new audio is ready
    const handleCanPlay = () => {
      audio.currentTime = currentTimeBackup;
      
      if (wasPlaying) {
        audio.play().catch((error) => {
          console.error('Failed to resume playback after quality change:', error);
        });
      }
      
      audio.removeEventListener('canplay', handleCanPlay);
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.load();
  };

  const setPlaylist = (newPlaylist: Media[], startIndex = 0) => {
    setPlaylistState(newPlaylist);
    setCurrentIndex(startIndex);
    if (newPlaylist[startIndex]) {
      loadMedia(newPlaylist[startIndex]);
    }
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    loadMedia(playlist[nextIndex]);
    
    if (isPlaying) {
      setTimeout(() => play(), 100);
    }
  };

  const previousTrack = () => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    loadMedia(playlist[prevIndex]);
    
    if (isPlaying) {
      setTimeout(() => play(), 100);
    }
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const setCurrentMediaWithCache = (media: Media) => {
    setCurrentMedia(media);
    setIsMinimized(false); // Show player when new media is set
  };

  const value: PlayerState = {
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    volume,
    quality,
    playlist,
    currentIndex,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setQuality,
    loadMedia,
    setCurrentMedia: setCurrentMediaWithCache,
    setPlaylist,
    nextTrack,
    previousTrack,
    isMinimized,
    toggleMinimized
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}