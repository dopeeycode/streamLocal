# StreamLocal - Sistema de Streaming de Áudio

Um sistema completo de streaming de áudio com processamento automático, múltiplas qualidades e interface web moderna.

## 🎯 Visão Geral

O StreamLocal permite upload de arquivos MP3, processamento automático em múltiplas qualidades (96k, 160k, 320k) e streaming otimizado com player web completo.

### ✨ Principais Funcionalidades

- 🎵 **Player de áudio completo** com seek, volume, qualidade
- 📊 **Dashboard de mídia** com biblioteca organizada  
- ⚡ **Streaming híbrido** (arquivo completo + segmentos)
- 🎛️ **Múltiplas qualidades** automáticas
- 📱 **Interface responsiva** e moderna
- 🔄 **Processamento em background** com feedback

## 🏗️ Stack Tecnológica

- **Frontend**: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Fastify + FFmpeg + Node.js
- **Database**: PostgreSQL + Prisma ORM
- **CDN**: nginx + Docker
- **Monorepo**: Turbo + Bun

## 🚀 Quick Start

```bash
# Clone e instale dependências
git clone <repo-url> streamLocal
cd streamLocal
bun install

# Configure o banco
cd packages/db
npx prisma migrate dev

# Inicie o sistema
cd ../apps/server && bun run dev  # Backend (porta 3333)
cd ../apps/web && bun run dev     # Frontend (porta 3000)
docker-compose up -d              # nginx CDN (porta 8080)
```

## 📚 Documentação Completa

A documentação está organizada em seções para facilitar a leitura:

### 📖 [Documentação Principal](./docs/README.md)
**Navegação completa** de toda a documentação

### 🎯 [1. Visão Geral](./docs/01-OVERVIEW.md)
- O que é o StreamLocal
- Principais funcionalidades  
- Como funciona
- Casos de uso

### 🏗️ [2. Arquitetura](./docs/02-ARCHITECTURE.md)
- Estrutura do sistema
- Fluxo de dados
- Componentes principais
- APIs e contratos

### 🔧 [3. Setup & Instalação](./docs/03-SETUP.md)
- Pré-requisitos
- Instalação passo a passo
- Configurações importantes
- Verificação da instalação

### 🎵 [4. Como Usar](./docs/04-USAGE.md)
- Tutorial completo
- Upload de música
- Navegação na biblioteca
- Usando o player

### 🔧 [5. Documentação Técnica](./docs/05-TECHNICAL.md)
- Implementação detalhada
- Código e arquitetura
- Optimizações de performance
- Considerações de segurança

### 🐛 [6. Troubleshooting](./docs/06-TROUBLESHOOTING.md)
- Problemas comuns
- Debugging avançado
- Monitoramento
- Onde buscar ajuda

## 🎪 Demo Rápida

1. **Upload**: Arraste um MP3 para a área de upload
2. **Processamento**: Aguarde a criação das 3 qualidades
3. **Player**: Reproduza com controles completos
4. **Biblioteca**: Navegue em suas músicas organizadas

## 🤝 Contribuindo

Este projeto foi desenvolvido como sistema de aprendizado para:
- Streaming de áudio na web
- Processamento de mídia com FFmpeg
- APIs REST com upload de arquivos
- Database design para metadata de mídia
- CDN e otimização de delivery

---

📚 **Comece aqui**: [Documentação Completa →](./docs/README.md)

3. Generate the Prisma client and push the schema:
```bash
bun run db:push
```


Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).







## Project Structure

```
streamLocal/
├── apps/
│   ├── web/         # Frontend application (Next.js)
│   └── server/      # Backend API (Fastify)
├── packages/
│   ├── api/         # API layer / business logic
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open database studio UI
