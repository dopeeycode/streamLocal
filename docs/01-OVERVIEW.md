# 1. Visão Geral do StreamLocal

## 🎯 O que é o StreamLocal?

O StreamLocal é um sistema completo de streaming de áudio desenvolvido para permitir upload, processamento e reprodução de arquivos MP3 de forma eficiente e moderna.

## ✨ Principais Funcionalidades

### 🎵 Player de Áudio Avançado
- **Controles completos**: Play/pause, seek, volume, restart
- **Indicador de progresso**: Barra visual com buffer
- **Múltiplas qualidades**: 96k, 160k, 320k (seleção automática)
- **Duração precisa**: Extração real do arquivo com ffprobe
- **Streaming híbrido**: Arquivo completo + segmentos para fallback

### 📊 Gerenciamento de Mídia
- **Dashboard organizado**: Lista todas as mídias com metadata
- **Upload intuitivo**: Drag & drop ou seleção de arquivos
- **Processamento em tempo real**: Feedback visual do progresso
- **Biblioteca searchável**: Interface para navegar no conteúdo

### ⚡ Performance Otimizada
- **Segmentação inteligente**: Chunks de 5 segundos para streaming
- **CDN integrado**: nginx para delivery rápido
- **Cache eficiente**: Arquivos concatenados para acesso direto
- **Múltiplas qualidades**: Adaptação automática à conexão

## 🏗️ Como Funciona

### 1. Upload e Processamento
```
MP3 Upload → FFmpeg Processing → 3 Qualidades → Segmentação → Armazenamento
```

### 2. Streaming
```
Requisição → nginx CDN → Arquivo/Segmentos → Player Web → Reprodução
```

### 3. Metadata
```
ffprobe → Duração Real → PostgreSQL → Manifest JSON → Frontend
```

## 🎪 Casos de Uso

### Para Desenvolvedores
- **Aprender streaming**: Implementação prática de audio streaming
- **Estudar FFmpeg**: Processamento de mídia em produção
- **Web APIs**: REST endpoints para upload e streaming
- **Database design**: Estrutura de dados para mídia

### Para Usuários
- **Biblioteca pessoal**: Organizar coleção de música
- **Streaming local**: Acesso remoto à música pessoal
- **Múltiplos dispositivos**: Player web universal
- **Qualidade adaptativa**: Economia de dados quando necessário

## 🔧 Diferencial Técnico

### Streaming Híbrido
O sistema usa uma abordagem híbrida inovadora:
1. **Primeiro**: Tenta carregar arquivo completo (`full.m4a`)
2. **Fallback**: Se não disponível, carrega todos os segmentos
3. **Resultado**: Melhor performance com compatibilidade garantida

### Duração Precisa
Problema resolvido: duração incorreta de arquivos processados
- **ffprobe**: Extrai duração real antes do processamento
- **Database**: Armazena metadata original
- **Player**: Usa duração do manifest, não do arquivo processado

---

➡️ **Próximo**: [Arquitetura do Sistema](./02-ARCHITECTURE.md)