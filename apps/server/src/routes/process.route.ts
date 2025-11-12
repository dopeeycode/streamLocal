import path from "path";
import fs from "fs";
import { exec } from "child_process";
import prisma from '@streamLocal/db'
import util from "util";
import type { FastifyInstance } from "fastify";

const execPromise = util.promisify(exec);

export async function processRoute(app: FastifyInstance) {
  app.post("/process/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const media = await prisma.media.findUnique({ where: { id } });
      if (!media) return reply.status(404).send({ error: "Media not found" });

      const input = media.filePath;
      const baseDir = path.join(process.cwd(), "mnt/data/media/chunks", id);
  

      // Verificar se o arquivo de entrada existe
      if (!fs.existsSync(input)) {
        return reply.status(404).send({ error: "Arquivo de áudio não encontrado" });
      }

      fs.mkdirSync(baseDir, { recursive: true });

      // Extrair duração real do áudio usando ffprobe
      let audioDuration: number | null = null;
      try {
        const probeCmd = `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${input}"`;
        const { stdout: durationOutput } = await execPromise(probeCmd);
        audioDuration = parseFloat(durationOutput.trim());
      } catch (error) {
        console.warn(`⚠️ Não foi possível extrair duração:`, error);
      }

      const bitrates = ["96k", "160k", "320k"];
      const qualities: Record<string, { url: string; segments: number }> = {};

      for (const br of bitrates) {
        const outDir = path.join(baseDir, `audio-${br}`);
        fs.mkdirSync(outDir, { recursive: true });
        
        // Comando FFmpeg mais preciso para segmentação
        const cmd = `ffmpeg -i "${input}" -vn -acodec aac -ab ${br} -f segment -segment_time 5 -segment_list_flags +live -reset_timestamps 1 "${outDir}/segment-%03d.m4a"`;
        

        try {
          const { stderr } = await execPromise(cmd);
          if (stderr) console.log(`FFmpeg stderr: ${stderr}`);
          
          // Contar quantos segmentos foram criados
          const segmentFiles = await fs.promises.readdir(outDir);
          const segmentCount = segmentFiles.filter(f => f.startsWith('segment-') && f.endsWith('.m4a')).length;
          
          // Criar arquivo concatenado para streaming mais eficiente
          const concatenatedPath = path.join(outDir, 'full.m4a');
          if (!await fs.promises.access(concatenatedPath).then(() => true).catch(() => false)) {
            try {
              
              // Listar todos os segmentos em ordem
              const orderedSegments = segmentFiles
                .filter(f => f.startsWith('segment-') && f.endsWith('.m4a'))
                .sort()
                .map(f => path.join(outDir, f));

              if (orderedSegments.length > 0) {
                // Criar lista de arquivos para ffmpeg
                const fileListPath = path.join(outDir, 'filelist.txt');
                const fileListContent = orderedSegments.map(file => `file '${path.basename(file)}'`).join('\n');
                await fs.promises.writeFile(fileListPath, fileListContent);

                // Concatenar usando ffmpeg
                const concatCmd = `ffmpeg -f concat -safe 0 -i "${fileListPath}" -c copy "${concatenatedPath}"`;
                
                try {
                  const { stderr: concatStderr } = await execPromise(concatCmd);
                  if (concatStderr) console.log(`Concat stderr: ${concatStderr}`);
                } finally {
                  // Limpar arquivo temporário
                  await fs.promises.unlink(fileListPath).catch(() => {});
                }
              }
            } catch (concatError) {
              console.warn(`⚠️ Não foi possível criar arquivo concatenado para ${br}:`, concatError);
              // Não falhar o processo por causa disso
            }
          }
          
          qualities[br] = {
            url: `/cdn/media/${id}/audio-${br}/`,
            segments: segmentCount
          };
        } catch (error) {
          console.error(`❌ Erro ao processar qualidade ${br}:`, error);
          return reply.status(500).send({ 
            error: `Erro no processamento FFmpeg para qualidade ${br}`,
            details: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      const manifest = {
        id,
        title: media.title,
        duration: audioDuration,
        qualities,
        createdAt: media.createdAt,
      };

      const manifestPath = path.join(baseDir, "manifest.json");
      await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      

      await prisma.media.update({
        where: { id },
        data: { 
          processed: true, 
          qualities,
          duration: audioDuration
        },
      });


      return { message: "✅ Processamento concluído", manifest };
    } catch (error) {
      console.error("❌ Erro no processamento:", error);
      return reply.status(500).send({ 
        error: "Erro interno no processamento",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
