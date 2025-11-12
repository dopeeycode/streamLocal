# 3. Setup & Instalação

## 🔧 Pré-requisitos

### Sistema
- **Node.js** 18+ com npm/bun
- **PostgreSQL** 15+
- **FFmpeg** com ffprobe
- **Docker** (opcional, para nginx CDN)

### Verificação
```bash
# Verificar instalações
node --version     # v18+
ffmpeg -version    # FFmpeg 4.4+
ffprobe -version   # FFprobe 4.4+
psql --version     # PostgreSQL 15+
```

## 📦 Instalação

### 1. Clone e Dependências
```bash
# Clone o repositório
git clone <repository-url> streamLocal
cd streamLocal

# Instalar dependências (usando Bun)
bun install

# Ou usando npm
npm install
```

### 2. Configuração do Banco
```bash
# Criar banco PostgreSQL
sudo -u postgres createdb streamlocal

# Navegar para o package db
cd packages/db

# Configurar .env (copie de apps/server/.env)
cp ../../apps/server/.env .

# Aplicar migrations
npx prisma migrate dev
```

### 3. Configuração do Backend
```bash
# Navegar para o servidor
cd apps/server

# Criar diretórios necessários
mkdir -p mnt/data/media/chunks

# Configurar .env
echo "DATABASE_URL=postgresql://username:password@localhost:5432/streamlocal" > .env
echo "PORT=3333" >> .env
```

### 4. Configuração do nginx CDN
```bash
# Iniciar nginx com Docker
docker-compose up -d

# Verificar se está rodando
curl http://localhost:8080/health
```

## 🚀 Execução

### Desenvolvimento
```bash
# Terminal 1: Backend
cd apps/server
bun run dev
# Servidor rodando em http://localhost:3333

# Terminal 2: Frontend  
cd apps/web
bun run dev
# Interface em http://localhost:3000

# Terminal 3: Database (opcional)
cd packages/db
npx prisma studio
# Database UI em http://localhost:5555
```

### Produção
```bash
# Build do frontend
cd apps/web
bun run build

# Build do backend
cd apps/server  
bun run build

# Iniciar produção
bun run start
```

## 🔧 Configurações Importantes

### Environment Variables (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/streamlocal

# Server
PORT=3333
NODE_ENV=development

# File Upload
UPLOAD_DIR=./mnt/data/media
MAX_FILE_SIZE=50MB

# CDN
CDN_BASE_URL=http://localhost:8080/cdn
```

### FFmpeg Setup
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Verificar codecs necessários
ffmpeg -codecs | grep aac
```

### Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./apps/server/mnt/data/media/chunks:/usr/share/nginx/html/cdn/media
      - ./nginx.conf:/etc/nginx/nginx.conf
```

## 🧪 Verificação da Instalação

### 1. Teste do Backend
```bash
curl http://localhost:3333/health
# Resposta: {"status":"ok"}
```

### 2. Teste do Frontend
```bash
curl http://localhost:3000
# Deve retornar HTML da homepage
```

### 3. Teste do CDN
```bash
curl http://localhost:8080/health  
# Resposta: nginx health check
```

### 4. Teste do Database
```bash
cd packages/db
npx prisma db execute --stdin <<< "SELECT 1;"
# Deve conectar sem erro
```

## 🐛 Troubleshooting Comum

### Erro: FFmpeg não encontrado
```bash
# Adicionar ao PATH (Linux)
export PATH=$PATH:/usr/local/bin

# Verificar localização
which ffmpeg
which ffprobe
```

### Erro: Permissão de diretório
```bash
# Corrigir permissões
chmod -R 755 apps/server/mnt/data/
chown -R $USER:$USER apps/server/mnt/data/
```

### Erro: Conexão do banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U username -d streamlocal
```

### Erro: CORS no CDN
Verificar se nginx.conf tem:
```nginx
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
```

---

➡️ **Próximo**: [Como Usar](./04-USAGE.md)