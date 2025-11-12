# 4. Como Usar o StreamLocal

## 🎵 Tutorial Completo

### 1. Acessando o Sistema
1. Abra o navegador em `http://localhost:3000`
2. Você verá a homepage com opções de upload e navegação

### 2. Upload de Música

#### Primeira vez
1. Clique em **"Upload"** na barra de navegação
2. Arraste um arquivo MP3 para a área de upload ou clique para selecionar
3. Aguarde o processamento (barra de progresso aparecerá)
4. Após completar, você será redirecionado para o player

#### O que acontece no processamento:
- ✅ **Extração de metadata** (duração, título)
- ✅ **Criação de 3 qualidades** (96k, 160k, 320k)
- ✅ **Segmentação** em chunks de 5 segundos
- ✅ **Criação de arquivo concatenado** para streaming rápido
- ✅ **Salvamento no banco** com todas as informações

### 3. Navegação na Biblioteca

#### Acessando suas músicas
1. Clique em **"Biblioteca"** na navegação
2. Você verá todas as músicas processadas
3. Cada item mostra:
   - 🎵 **Título** da música
   - ⏱️ **Duração** real
   - 📅 **Data de upload**
   - ▶️ **Botão de reprodução**

#### Reproduzindo música
1. Clique no botão ▶️ de qualquer música
2. Será redirecionado para o player completo

### 4. Usando o Player

#### Controles Principais
- **▶️ Play/Pause**: Inicia ou pausa a reprodução
- **🔄 Restart**: Volta para o início
- **🔊 Volume**: Controle deslizante de volume
- **⚙️ Qualidade**: Selector de qualidade (96k/160k/320k)

#### Barra de Progresso
- **Clique**: Navega para qualquer ponto da música
- **Progresso azul**: Posição atual
- **Progresso cinza**: Buffer carregado

#### Informações Exibidas
- **Tempo atual** / **Duração total**
- **Qualidade selecionada** e bitrate
- **Debug info** (modo desenvolvimento): valores técnicos

### 5. Recursos Avançados

#### Seleção de Qualidade
O sistema oferece 3 qualidades automáticas:
- **96k**: Para conexões lentas ou economia de dados
- **160k**: Qualidade padrão balanceada (recomendada)
- **320k**: Alta qualidade para audiência exigente

#### Streaming Inteligente
O player usa estratégia híbrida:
1. **Primeira tentativa**: Carrega arquivo completo (`full.m4a`)
2. **Fallback automático**: Se não disponível, carrega segmentos individuais
3. **Resultado**: Melhor performance possível sempre

## 📱 Interface e Experiência

### Design Responsivo
- **Desktop**: Layout completo com sidebar e controles expandidos
- **Tablet**: Interface adaptada para touch
- **Mobile**: Player compacto e navegação otimizada

### Feedback Visual
- **Loading states**: Indicadores durante processamento
- **Progress bars**: Para upload e carregamento de audio
- **Error handling**: Mensagens claras de erro
- **Success feedback**: Confirmações de ações

### Acessibilidade
- **Keyboard navigation**: Todos os controles acessíveis via teclado
- **Screen reader**: Labels e ARIA attributes
- **High contrast**: Suporte a temas escuros
- **Focus indicators**: Elementos focados claramente visíveis

## 🎯 Casos de Uso Práticos

### Para Músicos
1. **Upload de demos**: Compartilhar rascunhos com qualidade
2. **Portfolio online**: Biblioteca organizada de trabalhos
3. **Teste de qualidades**: Comparar diferentes bitrates

### Para Desenvolvedores
1. **Estudo de streaming**: Entender como funciona na prática
2. **Teste de APIs**: Endpoints RESTful completos
3. **Performance analysis**: Monitorar carregamento e streaming

### Para Usuários Domésticos
1. **Biblioteca pessoal**: Organizar coleção musical
2. **Acesso remoto**: Músicas disponíveis em qualquer lugar
3. **Múltiplos dispositivos**: Sincronização entre dispositivos

## 🔧 Dicas e Truques

### Upload Otimizado
- **Formatos suportados**: MP3 (outros formatos serão convertidos)
- **Tamanho máximo**: 50MB por arquivo
- **Qualidade original**: Mantenha arquivos em 320kbps para melhor resultado

### Performance
- **Primeira reprodução**: Pode demorar alguns segundos (normal)
- **Reproduções seguintes**: Instantâneas graças ao cache
- **Qualidade automática**: Sistema escolhe melhor qualidade disponível

### Monitoramento
- **Console do navegador**: Logs técnicos em modo desenvolvimento
- **Network tab**: Monitorar downloads de segmentos
- **Prisma Studio**: Visualizar dados do banco (desenvolvedores)

---

➡️ **Próximo**: [Documentação Técnica](./05-TECHNICAL.md)