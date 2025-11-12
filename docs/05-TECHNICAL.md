# 5. Documentação Técnica

## 🔧 Implementação Detalhada

### Frontend Architecture

#### React Components Structure
```typescript
// PlayerSimple.tsx - Componente principal do player
interface PlayerProps {
  mediaId: string;
}

interface Manifest {
  id: string;
  title: string;
  duration?: number;
  qualities: Record<string, QualityInfo | string>;
}

// Estados principais
const [manifest, setManifest] = useState<Manifest | null>(null);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [playing, setPlaying] = useState(false);
```

#### Streaming Strategy
```typescript
// Híbrido: Arquivo completo primeiro, segmentos como fallback
const loadAudio = async () => {
  // 1. Tentar arquivo concatenado
  const concatenatedUrl = `${baseUrl}full.m4a`;
  const testResponse = await fetch(concatenatedUrl, { method: 'HEAD' });
  
  if (testResponse.ok) {
    // Usar arquivo completo (mais eficiente)
    audio.src = concatenatedUrl;
    audio.load();
    return;
  }
  
  // 2. Fallback: carregar todos os segmentos
  await loadAllSegments(baseUrl);
};
```

#### Duration Handling
```typescript
// Problema resolvido: duração precisa do manifest
const handleLoadedMetadata = () => {
  if (manifest.duration && manifest.duration > 0 && manifest.duration < 86400) {
    safeSetDuration(manifest.duration); // Usar duração do manifest
    console.log(`⏱️ Usando duração do manifest: ${manifest.duration.toFixed(1)}s`);
  } else if (audio.duration && isFinite(audio.duration)) {
    safeSetDuration(audio.duration); // Fallback para duração do audio
  }
};
```

### Backend Architecture

#### Fastify Server Setup
```typescript
// server/src/index.ts
import Fastify from 'fastify';
import multer from '@fastify/multipart';

const fastify = Fastify({ logger: true });

// Registrar plugins
await fastify.register(multer);
await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// Registrar rotas
await fastify.register(uploadRoutes, { prefix: '/api/media' });
await fastify.register(processRoutes, { prefix: '/api' });
```

#### Upload Processing Pipeline
```typescript
// routes/upload.route.ts
export async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/upload', async (request, reply) => {
    // 1. Receber arquivo via multipart
    const data = await request.file();
    
    // 2. Salvar temporariamente
    const tempPath = path.join(uploadDir, `temp-${Date.now()}-${data.filename}`);
    await pump(data.file, fs.createWriteStream(tempPath));
    
    // 3. Extrair duração com ffprobe
    const durationCmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${tempPath}"`;
    const { stdout: durationStr } = await execPromise(durationCmd);
    const duration = parseFloat(durationStr.trim());
    
    // 4. Salvar no banco
    const media = await prisma.media.create({
      data: {
        title: data.filename,
        filename: data.filename,
        size: statResult.size,
        duration: isNaN(duration) ? null : duration,
      }
    });
    
    // 5. Processar em background
    processInBackground(media.id, tempPath);
    
    return { success: true, mediaId: media.id };
  });
}
```

#### FFmpeg Processing
```typescript
// routes/process.route.ts
const processMedia = async (mediaId: string, inputPath: string) => {
  const baseDir = path.join(process.env.UPLOAD_DIR!, 'chunks', mediaId);
  const bitrates = ['96k', '160k', '320k'];
  
  for (const br of bitrates) {
    const outDir = path.join(baseDir, `audio-${br}`);
    fs.mkdirSync(outDir, { recursive: true });
    
    // Comando FFmpeg otimizado para segmentação
    const cmd = `ffmpeg -i "${inputPath}" -vn -acodec aac -ab ${br} ` +
               `-f segment -segment_time 5 -segment_list_flags +live ` +
               `-reset_timestamps 1 "${outDir}/segment-%03d.m4a"`;
    
    await execPromise(cmd);
    
    // Criar arquivo concatenado para performance
    await createConcatenatedFile(outDir);
  }
  
  // Criar manifest.json
  await generateManifest(mediaId, baseDir);
};
```

### Database Schema

#### Prisma Models
```prisma
// packages/db/prisma/schema/schema.prisma
model Media {
  id        String   @id @default(cuid())
  title     String
  filename  String
  size      Int
  duration  Float?   // Duração em segundos (extraída com ffprobe)
  processed Boolean  @default(false)
  qualities Json?    // JSON com informações das qualidades
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("Media")
}
```

#### Database Operations
```typescript
// Criar media com duração
const media = await prisma.media.create({
  data: {
    title: filename,
    filename: filename,
    size: fileSize,
    duration: extractedDuration, // ffprobe result
    processed: false
  }
});

// Atualizar após processamento
await prisma.media.update({
  where: { id: mediaId },
  data: {
    processed: true,
    qualities: {
      "96k": { segments: segmentCount },
      "160k": { segments: segmentCount },
      "320k": { segments: segmentCount }
    }
  }
});
```

### CDN Configuration

#### nginx Setup
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    server {
        listen 8080;
        server_name localhost;
        
        # Health check
        location /health {
            return 200 'OK';
            add_header Content-Type text/plain;
        }
        
        # Media serving
        location /cdn/media/ {
            alias /usr/share/nginx/html/cdn/media/;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            
            # Cache optimization
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

#### Docker Integration
```yaml
# docker-compose.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    container_name: streamlocal-cdn
    ports:
      - "8080:8080"
    volumes:
      - ./apps/server/mnt/data/media/chunks:/usr/share/nginx/html/cdn/media:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: unless-stopped
```

## 🚀 Performance Optimizations

### Streaming Optimizations
1. **Arquivo Concatenado**: Evita múltiplas requisições HTTP
2. **Segmentação de 5s**: Balance entre latência e overhead
3. **Múltiplas Qualidades**: Adaptação à conexão
4. **Cache Agressivo**: Headers de cache de 1 ano
5. **CORS Pré-configurado**: Evita preflight OPTIONS

### Frontend Optimizations
1. **React.memo**: Evita re-renders desnecessários
2. **useCallback**: Memoização de event handlers
3. **Lazy Loading**: Componentes carregados sob demanda
4. **Service Worker**: Cache de assets estáticos
5. **Bundle Splitting**: Código dividido por rota

### Backend Optimizations
1. **Fastify**: Framework performático vs Express
2. **Streaming Upload**: Não carrega arquivo inteiro na memória
3. **Background Processing**: Upload não bloqueia interface
4. **Connection Pooling**: Prisma otimiza conexões DB
5. **Error Boundaries**: Isolamento de falhas

## 🔒 Security Considerations

### File Upload Security
```typescript
// Validação de tipo de arquivo
const allowedMimeTypes = ['audio/mpeg', 'audio/mp3'];
if (!allowedMimeTypes.includes(data.mimetype)) {
  throw new Error('Tipo de arquivo não permitido');
}

// Limitação de tamanho
const maxSize = 50 * 1024 * 1024; // 50MB
if (fileSize > maxSize) {
  throw new Error('Arquivo muito grande');
}

// Sanitização de nome
const safeName = data.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
```

### Path Traversal Prevention
```typescript
// Validação de mediaId
const mediaIdRegex = /^[a-zA-Z0-9]{25}$/;
if (!mediaIdRegex.test(mediaId)) {
  throw new Error('Media ID inválido');
}

// Resolução segura de path
const safePath = path.resolve(baseDir, mediaId);
if (!safePath.startsWith(baseDir)) {
  throw new Error('Path inválido');
}
```

---

➡️ **Próximo**: [Troubleshooting](./06-TROUBLESHOOTING.md)