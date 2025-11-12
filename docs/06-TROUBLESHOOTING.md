# 6. Troubleshooting

## 🐛 Problemas Comuns e Soluções

### Upload e Processamento

#### Erro: "FFmpeg não encontrado"
```bash
# Verificar instalação
which ffmpeg
which ffprobe

# Instalar se necessário (Ubuntu/Debian)
sudo apt update && sudo apt install ffmpeg

# Instalar se necessário (macOS)
brew install ffmpeg

# Verificar PATH
echo $PATH | grep -o '/usr/local/bin'
```

#### Erro: "Arquivo muito grande"
```bash
# Verificar limite no backend
grep MAX_FILE_SIZE apps/server/.env

# Aumentar limite (em bytes)
echo "MAX_FILE_SIZE=104857600" >> apps/server/.env  # 100MB
```

#### Erro: "Erro ao processar áudio"
```bash
# Verificar logs do backend
cd apps/server
bun run dev

# Testar FFmpeg manualmente
ffprobe -v quiet -show_entries format=duration -of csv=p=0 test.mp3
ffmpeg -i test.mp3 -vn -acodec aac -ab 160k test-output.m4a
```

#### Erro: "Permissão negada" ao salvar arquivo
```bash
# Verificar permissões do diretório
ls -la apps/server/mnt/data/media/

# Corrigir permissões
chmod -R 755 apps/server/mnt/data/
chown -R $USER:$USER apps/server/mnt/data/
```

### Streaming e Player

#### Player não carrega áudio
```bash
# 1. Verificar se nginx está rodando
curl http://localhost:8080/health

# 2. Verificar CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:8080/cdn/media/

# 3. Verificar se arquivos existem
ls apps/server/mnt/data/media/chunks/{mediaId}/audio-160k/
```

#### Duração incorreta no player
```bash
# Verificar duração no manifest
cat apps/server/mnt/data/media/chunks/{mediaId}/manifest.json

# Verificar duração real do arquivo
ffprobe -v quiet -show_entries format=duration -of csv=p=0 \
        apps/server/mnt/data/media/chunks/{mediaId}/audio-160k/full.m4a

# Se divergir, reprocessar o arquivo
rm -rf apps/server/mnt/data/media/chunks/{mediaId}/
# Refazer upload
```

#### Player trava ou não responde
```javascript
// Abrir console do navegador (F12) e verificar erros
// Procurar por:
// - Erros de CORS
// - Erros de network
// - Erros de MediaSource API

// Logs esperados:
// "🎵 Carregando qualidade: 160k"
// "✅ Usando arquivo concatenado"
// "⏱️ Usando duração do manifest: 339.1s"
```

### Database

#### Erro: "Database connection failed"
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão manual
psql -h localhost -U username -d streamlocal

# Verificar .env
cd packages/db
grep DATABASE_URL .env
```

#### Erro: "Prisma migration failed"
```bash
# Reset do banco (CUIDADO: apaga dados)
cd packages/db
npx prisma migrate reset --force

# Aplicar migrations
npx prisma migrate dev

# Verificar status
npx prisma migrate status
```

#### Tabela "Media" não existe
```bash
# Gerar e aplicar migration
cd packages/db
npx prisma db push

# Ou aplicar migrations pendentes
npx prisma migrate deploy
```

### Network e CDN

#### nginx retorna 404 para arquivos
```bash
# Verificar mapeamento de volumes
docker-compose ps
docker-compose logs nginx

# Verificar path interno do container
docker exec -it streamlocal-cdn ls -la /usr/share/nginx/html/cdn/media/

# Verificar nginx.conf
cat nginx.conf | grep alias
```

#### CORS bloqueando requisições
```nginx
# Adicionar ao nginx.conf na seção location /cdn/media/
add_header 'Access-Control-Allow-Origin' '*';
add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';

# Reiniciar nginx
docker-compose restart nginx
```

### Frontend

#### Página em branco ou erro de build
```bash
# Verificar logs de build
cd apps/web
bun run dev

# Limpar cache
rm -rf .next/
bun run build

# Verificar dependências
bun install
```

#### Componentes não renderizam
```bash
# Verificar erros no console (F12)
# Procurar por:
// - Erros de import
// - Erros de TypeScript
// - Erros de props

# Verificar se shadcn/ui está instalado
ls apps/web/src/components/ui/
```

## 🔧 Debugging Avançado

### Logs do Sistema

#### Backend Logs
```bash
# Modo verbose
cd apps/server
DEBUG=* bun run dev

# Logs específicos do FFmpeg
grep "FFmpeg" logs/*.log

# Logs específicos do upload
grep "upload" logs/*.log
```

#### Frontend Logs
```javascript
// No console do navegador
localStorage.setItem('debug', 'true');
// Recarregar página

// Verificar network tab para:
// - Requests para manifest.json
// - Requests para arquivos de audio
// - Status codes e response times
```

#### Database Logs
```bash
# Logs do PostgreSQL (Ubuntu)
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Logs do Prisma
cd packages/db
npx prisma studio
# Verificar queries na interface
```

### Performance Debugging

#### Upload Lento
```bash
# Verificar tamanho do arquivo
ls -lh arquivo.mp3

# Verificar espaço em disco
df -h

# Verificar uso de CPU durante processamento
top -p $(pgrep ffmpeg)
```

#### Streaming Lento
```javascript
// No console do navegador
// Verificar network waterfall
// - Tempo para carregar manifest
// - Tempo para carregar primeiro segmento
// - Paralelização de downloads

// Teste de velocidade da CDN
fetch('/cdn/media/test-file.m4a')
  .then(response => {
    console.log('CDN response time:', response.headers.get('x-response-time'));
  });
```

### Monitoramento

#### Health Checks
```bash
# Backend health
curl http://localhost:3333/health

# Frontend health
curl http://localhost:3000

# CDN health
curl http://localhost:8080/health

# Database health
cd packages/db
npx prisma db execute --stdin <<< "SELECT 1;"
```

#### Resource Usage
```bash
# CPU e memória
htop

# Espaço em disco
du -sh apps/server/mnt/data/media/chunks/

# Conexões de rede
netstat -tulnp | grep :3333
netstat -tulnp | grep :8080
```

## 📞 Onde Buscar Ajuda

### Logs Importantes
1. **Backend**: `apps/server/logs/`
2. **Console do navegador**: F12 → Console
3. **Network tab**: F12 → Network
4. **PostgreSQL**: `/var/log/postgresql/`
5. **nginx**: `docker-compose logs nginx`

### Comandos de Diagnóstico
```bash
# Status geral do sistema
./scripts/health-check.sh

# Verificar todas as dependências
./scripts/verify-setup.sh

# Reset completo (CUIDADO)
./scripts/reset-system.sh
```

### Informações Úteis para Suporte
- Versão do Node.js: `node --version`
- Versão do FFmpeg: `ffmpeg -version`
- Sistema operacional: `uname -a`
- Logs relevantes com timestamps
- Passos para reproduzir o problema

---

🎉 **Documentação completa!** Agora você tem todas as informações necessárias para usar, desenvolver e resolver problemas no StreamLocal.