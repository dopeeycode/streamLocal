"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileAudio, Play, Trash2, Upload, RefreshCw, Clock, CheckCircle, Music, Pause, ListMusic } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/contexts/player-context";
import type { Media } from "@/types";
import Link from "next/link";
import { MediaCard } from "@/components/media-card";

export default function MediaListPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  const router = useRouter();
  const { 
    loadMedia: loadPlayerMedia, 
    setPlaylist, 
    currentMedia, 
    isPlaying, 
    play, 
    pause 
  } = usePlayer();

  const loadMedia = async () => {
    try {
      setLoading(true);
      const mediaList = await apiClient.listMedia();
      setMedia(mediaList);
    } catch (error) {
      toast.error(`Erro ao carregar mídias: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const startProcessing = async (mediaId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(mediaId));
      toast.loading(`Iniciando processamento...`, { id: mediaId });
      
      await apiClient.processMedia(mediaId);
      
      toast.success(`Processamento concluído!`, { id: mediaId });
      
      // Atualizar a lista
      setMedia(prev => 
        prev.map(m => 
          m.id === mediaId 
            ? { ...m, processed: true }
            : m
        )
      );
    } catch (error) {
      toast.error(`Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: mediaId });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    }
  };

  const deleteMedia = async (mediaId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${title}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setDeletingIds(prev => new Set(prev).add(mediaId));
      toast.loading(`Deletando mídia...`, { id: `delete-${mediaId}` });
      
      await apiClient.deleteMedia(mediaId);
      
      toast.success(`Mídia deletada com sucesso!`, { id: `delete-${mediaId}` });
      
      // Remover da lista
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (error) {
      toast.error(`Erro ao deletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: `delete-${mediaId}` });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
    }
  };

  const handlePlayMedia = (selectedMedia: Media) => {
    if (currentMedia?.id === selectedMedia.id) {
      // Same media, just toggle play/pause
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      // Different media, load and play
      loadPlayerMedia(selectedMedia);
      setTimeout(() => play(), 100);
    }
  };

  const handlePlayAll = () => {
    const processedMedia = media.filter(m => m.processed);
    if (processedMedia.length === 0) {
      toast.error("Nenhuma mídia processada disponível");
      return;
    }
    
    setPlaylist(processedMedia, 0);
    setTimeout(() => play(), 100);
    toast.success(`Playlist criada com ${processedMedia.length} música(s)`);
  };

  const isCurrentMedia = (mediaItem: Media) => currentMedia?.id === mediaItem.id;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Carregando mídias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca de Mídia</h1>
            <p className="text-muted-foreground">
              Gerencie seus arquivos de áudio enviados
            </p>
          </div>
          
          <div className="flex space-x-2">
            {media.filter(m => m.processed).length > 0 && (
              <Button onClick={handlePlayAll} variant="outline" className="gap-2">
                <ListMusic className="h-4 w-4" />
                Reproduzir Todas
              </Button>
            )}
            <Button onClick={loadMedia} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Link href="/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Novo Upload
              </Button>
            </Link>
          </div>
        </div>

        {media.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileAudio className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma mídia encontrada</h3>
              <p className="text-muted-foreground text-center mb-6">
                Você ainda não enviou nenhum arquivo de áudio.
              </p>
              <Link href="/upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Fazer Upload
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {media.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  processingIds={processingIds}
                  deletingIds={deletingIds}
                  onPlayMedia={handlePlayMedia}
                  onStartProcessing={startProcessing}
                  onDeleteMedia={deleteMedia}
                />
              ))}
            </div>
        )}
      </div>
    </div>
  );
}