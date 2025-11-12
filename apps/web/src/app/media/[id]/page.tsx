"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/contexts/player-context";
import { apiClient } from "@/lib/api-client";
import { cleanMediaTitle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Music, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Media } from "@/types";

type MediaPageProps = {
  params: Promise<{ id: string }>;
};

export default function MediaPage({ params }: MediaPageProps) {
  const [mediaId, setMediaId] = useState<string>("");
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const { loadMedia, currentMedia, isPlaying, play, pause } = usePlayer();

  useEffect(() => {
    params.then(({ id }) => setMediaId(id));
  }, [params]);

  useEffect(() => {
    if (!mediaId) return;

    const fetchMedia = async () => {
      try {
        const mediaData = await apiClient.getMedia(mediaId);
        setMedia(mediaData);
      } catch (error) {
        console.error("Erro ao carregar mídia:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedia();
  }, [mediaId]);

  const handlePlayClick = () => {
    if (!media) return;

    if (currentMedia?.id === media.id) {
      // Same media, just toggle play/pause
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      // Different media, load and play
      loadMedia(media);
      setTimeout(() => play(), 100);
    }
  };

  const isCurrentMedia = currentMedia?.id === media?.id;

  if (loading) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Carregando...</div>
      </main>
    );
  }

  if (!media) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Mídia não encontrada</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/media">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à Biblioteca
          </Button>
        </Link>

        {/* Media Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Music className="h-6 w-6" />
                  {cleanMediaTitle(media.title)}
                </CardTitle>
                <CardDescription>
                  {media.processed ? "Pronto para streaming" : "Aguardando processamento"}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={media.processed ? "default" : "secondary"}>
                  {media.processed ? "Processado" : "Pendente"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {media.processed ? (
              <>
                {/* Play Button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handlePlayClick}
                    className="gap-2 px-8 py-3 text-lg"
                  >
                    {isCurrentMedia && isPlaying ? (
                      <>
                        <Pause className="h-5 w-5" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        {isCurrentMedia ? "Continuar" : "Reproduzir"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Media Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-medium mb-2">Informações do Arquivo</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Formato:</strong> MP3</p>
                      <p><strong>Qualidades disponíveis:</strong> 96k, 160k, 320k</p>
                      <p><strong>Status:</strong> {media.processed ? "Processado" : "Pendente"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Streaming</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p><strong>Tipo:</strong> HLS Adaptativo</p>
                      <p><strong>Protocolo:</strong> HTTP Live Streaming</p>
                      <p><strong>Compatibilidade:</strong> Universal</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Como usar</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Clique em "Reproduzir" para iniciar a reprodução no player global</li>
                    <li>• O player permanecerá ativo ao navegar entre páginas</li>
                    <li>• Use os controles na parte inferior para ajustar volume e qualidade</li>
                    <li>• O streaming se adapta automaticamente à sua conexão</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center p-8">
                <p className="text-muted-foreground mb-4">
                  Esta mídia ainda não foi processada. O processamento é necessário para gerar
                  as diferentes qualidades de áudio para streaming.
                </p>
                <Button onClick={() => {/* TODO: Implementar processamento */}}>
                  Iniciar Processamento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
