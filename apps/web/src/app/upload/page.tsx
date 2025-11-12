"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Edit3 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Media } from "@/types";

interface FileWithCustomName {
  file: File;
  customName: string;
  originalName: string;
  isEditing: boolean;
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithCustomName[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, "uploading" | "success" | "error">>({});
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const audioFiles = droppedFiles.filter(file => 
      file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|ogg|m4a|aac)$/i)
    );

    if (audioFiles.length === 0) {
      toast.error("Por favor, selecione apenas arquivos de áudio");
      return;
    }

    if (audioFiles.length !== droppedFiles.length) {
      toast.warning("Alguns arquivos foram ignorados (apenas arquivos de áudio são aceitos)");
    }

    const filesWithCustomName: FileWithCustomName[] = audioFiles.map(file => ({
      file,
      customName: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
      originalName: file.name.replace(/\.[^/.]+$/, ""), // Salva o nome original
      isEditing: false
    }));

    setFiles(prev => [...prev, ...filesWithCustomName]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFiles = Array.from(e.target.files);
      const filesWithCustomName: FileWithCustomName[] = selectedFiles.map(file => ({
        file,
        customName: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
        originalName: file.name.replace(/\.[^/.]+$/, ""), // Salva o nome original
        isEditing: false
      }));
      setFiles(prev => [...prev, ...filesWithCustomName]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleEdit = (index: number) => {
    setFiles(prev => prev.map((fileData, i) => 
      i === index ? { ...fileData, isEditing: !fileData.isEditing } : fileData
    ));
  };

  const updateCustomName = (index: number, newName: string) => {
    setFiles(prev => prev.map((fileData, i) => 
      i === index ? { ...fileData, customName: newName } : fileData
    ));
  };

  const cancelEdit = (index: number) => {
    setFiles(prev => prev.map((fileData, i) => 
      i === index 
        ? { ...fileData, customName: fileData.originalName, isEditing: false }
        : fileData
    ));
  };

  const confirmEdit = (index: number) => {
    setFiles(prev => prev.map((fileData, i) => 
      i === index ? { ...fileData, isEditing: false } : fileData
    ));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const newUploadedMedia: Media[] = [];

    for (const fileData of files) {
      try {
        const fileKey = fileData.file.name;
        setUploadProgress(prev => ({ ...prev, [fileKey]: "uploading" }));
        
        // Criar um novo arquivo com o nome customizado se necessário
        const fileToUpload = fileData.customName !== fileData.file.name.replace(/\.[^/.]+$/, "") 
          ? new File([fileData.file], `${fileData.customName}.${fileData.file.name.split('.').pop()}`, {
              type: fileData.file.type,
              lastModified: fileData.file.lastModified
            })
          : fileData.file;
        
        const response = await apiClient.uploadFile(fileToUpload);
        
        setUploadProgress(prev => ({ ...prev, [fileKey]: "success" }));
        newUploadedMedia.push(response.media);
        
        toast.success(`${fileData.customName} enviado com sucesso!`);
      } catch (error) {
        const fileKey = fileData.file.name;
        setUploadProgress(prev => ({ ...prev, [fileKey]: "error" }));
        toast.error(`Erro ao enviar ${fileData.customName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    setUploadedMedia(prev => [...prev, ...newUploadedMedia]);
    setUploading(false);
    
    if (newUploadedMedia.length > 0) {
      toast.success(`${newUploadedMedia.length} arquivo(s) enviado(s) com sucesso!`);
    }
  };

  const startProcessing = async (mediaId: string) => {
    try {
      toast.loading(`Iniciando processamento...`, { id: mediaId });
      await apiClient.processMedia(mediaId);
      toast.success(`Processamento iniciado com sucesso!`, { id: mediaId });
      
      // Atualizar a lista
      setUploadedMedia(prev => 
        prev.map(media => 
          media.id === mediaId 
            ? { ...media, processed: true }
            : media
        )
      );
    } catch (error) {
      toast.error(`Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: mediaId });
    }
  };

  const getFileIcon = (status: "uploading" | "success" | "error" | undefined) => {
    switch (status) {
      case "uploading":
        return <Upload className="h-4 w-4 animate-pulse text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileAudio className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Upload de Áudio</h1>
          <p className="text-muted-foreground">
            Envie seus arquivos de áudio para serem processados e disponibilizados para streaming
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecionar Arquivos</CardTitle>
            <CardDescription>
              Arraste e solte arquivos de áudio ou clique para selecionar. Você pode editar o nome dos arquivos antes do upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  Arraste arquivos de áudio aqui
                </p>
                <p className="text-sm text-muted-foreground">
                  Ou clique no botão abaixo para selecionar arquivos
                </p>
              </div>
              
              <div className="mt-6">
                <Button
                  onClick={() => inputRef.current?.click()}
                  variant="outline"
                  className="mx-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivos
                </Button>
                <Input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">
                    Arquivos Selecionados ({files.length})
                  </Label>
                  <Button
                    onClick={uploadFiles}
                    disabled={uploading}
                    className="min-w-32"
                  >
                    {uploading ? "Enviando..." : "Enviar Arquivos"}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {files.map((fileData, index) => (
                    <div
                      key={`${fileData.file.name}-${index}`}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {getFileIcon(uploadProgress[fileData.file.name])}
                        <div className="flex-1 space-y-2">
                          {fileData.isEditing ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={fileData.customName}
                                onChange={(e) => updateCustomName(index, e.target.value)}
                                onBlur={() => cancelEdit(index)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    confirmEdit(index);
                                  } else if (e.key === 'Escape') {
                                    cancelEdit(index);
                                  }
                                }}
                                className="font-medium"
                                autoFocus
                              />
                              <span className="text-sm text-muted-foreground">
                                .{fileData.file.name.split('.').pop()}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">
                                {fileData.customName}.{fileData.file.name.split('.').pop()}
                              </p>
                              {!uploading && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleEdit(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                            {fileData.customName !== fileData.file.name.replace(/\.[^/.]+$/, "") && (
                              <span className="ml-2 text-xs text-primary">(nome alterado)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {!uploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {uploadedMedia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Enviados</CardTitle>
              <CardDescription>
                Arquivos prontos para processamento ou já processados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadedMedia.map((media) => (
                  <div
                    key={media.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileAudio className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{media.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {media.processed ? "Processado" : "Aguardando processamento"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {!media.processed ? (
                        <Button
                          size="sm"
                          onClick={() => startProcessing(media.id)}
                        >
                          Processar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/media/${media.id}`)}
                        >
                          Reproduzir
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}