"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileAudio, 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  Music,
  MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/contexts/player-context";
import { cleanMediaTitle, cn } from "@/lib/utils";
import type { Media } from "@/types";

interface MediaCardProps {
  item: Media;
  processingIds: Set<string>;
  deletingIds: Set<string>;
  onPlayMedia: (media: Media) => void;
  onStartProcessing: (id: string) => void;
  onDeleteMedia: (id: string, title: string) => void;
}

export function MediaCard({ 
  item, 
  processingIds, 
  deletingIds, 
  onPlayMedia, 
  onStartProcessing, 
  onDeleteMedia 
}: MediaCardProps) {
  const router = useRouter();
  const { currentMedia, isPlaying } = usePlayer();
  
  const isCurrentMedia = currentMedia?.id === item.id;
  const isProcessing = processingIds.has(item.id);
  const isDeleting = deletingIds.has(item.id);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusInfo = () => {
    if (isProcessing) {
      return {
        icon: <RefreshCw className="w-3 h-3 animate-spin" />,
        text: "Processando...",
        variant: "secondary" as const,
        className: "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950 dark:text-amber-400"
      };
    }
    
    if (!item.processed) {
      return {
        icon: <Clock className="w-3 h-3" />,
        text: "Pendente",
        variant: "outline" as const,
        className: "text-muted-foreground"
      };
    }
    
    return {
      icon: <CheckCircle className="w-3 h-3" />,
      text: "Pronto",
      variant: "default" as const,
      className: "text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-400"
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 border",
      "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
      isCurrentMedia 
        ? "border-primary shadow-md bg-linear-to-br from-primary/5 to-primary/10" 
        : "border-border hover:border-primary/50 bg-card",
      isDeleting && "opacity-50 pointer-events-none"
    )}>
      {/* Playing indicator */}
      {isCurrentMedia && (
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-primary/60" />
      )}

      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left side - Icon and content */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Media icon with playing animation */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0",
              isCurrentMedia 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "bg-muted group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              {isCurrentMedia && isPlaying ? (
                <div className="flex items-center gap-0.5">
                  <div className="w-0.5 h-3 bg-current rounded-full animate-pulse" />
                  <div className="w-0.5 h-4 bg-current rounded-full animate-pulse [animation-delay:0.2s]" />
                  <div className="w-0.5 h-2 bg-current rounded-full animate-pulse [animation-delay:0.4s]" />
                </div>
              ) : (
                <Music className="w-5 h-5" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Title with better truncation */}
              <div className="space-y-1">
                <h3 
                  className={cn(
                    "font-semibold text-sm leading-tight line-clamp-2",
                    "wrap-break-word hyphens-auto",
                    isCurrentMedia ? "text-primary" : "text-foreground"
                  )}
                  title={cleanMediaTitle(item.title)}
                  style={{ wordBreak: "break-word" }}
                >
                  {cleanMediaTitle(item.title)}
                </h3>
                
                {/* File info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Status and menu */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Status badge */}
            <Badge 
              variant={statusInfo.variant}
              className={cn(
                "text-xs h-5 px-2 flex items-center gap-1 transition-all",
                statusInfo.className
              )}
            >
              {statusInfo.icon}
              {statusInfo.text}
            </Badge>

            {/* Menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
              onClick={() => router.push(`/media/${item.id}`)}
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {/* File path */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 min-w-0">
          <FileAudio className="w-3 h-3 shrink-0" />
          <span 
            className="truncate" 
            title={item.filePath?.split('/').pop() || 'Arquivo'}
          >
            {item.filePath?.split('/').pop() || 'Arquivo de mídia'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {item.processed ? (
            <>
              <Button
                size="sm"
                onClick={() => onPlayMedia(item)}
                className={cn(
                  "flex-1 h-8 text-xs transition-all",
                  isCurrentMedia && isPlaying && "bg-orange-500 hover:bg-orange-600"
                )}
                variant={isCurrentMedia && isPlaying ? "default" : "default"}
              >
                {isCurrentMedia && isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 mr-1.5" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 mr-1.5" />
                    {isCurrentMedia ? "Continuar" : "Reproduzir"}
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/media/${item.id}`)}
                className="h-8 w-8 p-0 hover:bg-primary/5 hover:border-primary/30"
              >
                <Music className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => onStartProcessing(item.id)}
              disabled={isProcessing}
              className="flex-1 h-8 text-xs"
              variant="outline"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  Processar
                </>
              )}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDeleteMedia(item.id, item.title)}
            disabled={isDeleting}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive"
          >
            {isDeleting ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        </div>

        {/* Current playing indicator */}
        {isCurrentMedia && (
          <div className="flex items-center gap-2 text-xs text-primary font-medium mt-3 pt-3 border-t border-primary/20">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>Reproduzindo agora</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}