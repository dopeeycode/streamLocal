import prisma from "@streamLocal/db";
import type { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";


export async function mediaRoute(app: FastifyInstance) {
  app.get("/media/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    // 1️⃣ Verifica se a mídia existe no banco
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return reply.status(404).send({ error: "Media not found" });

    // 2️⃣ Caminho para o manifest gerado pelo FFmpeg
    const manifestPath = path.join(
      process.cwd(),
      "mnt/data/media/chunks",
      id,
      "manifest.json"
    );

    if (!fs.existsSync(manifestPath)) {
      return reply.status(404).send({
        error: "Manifest not found — talvez o arquivo ainda não foi processado.",
      });
    }

    // 3️⃣ Lê o manifest
    const manifest = JSON.parse(await fs.promises.readFile(manifestPath, "utf-8"));

    // 4️⃣ (Garantia extra) substitui os caminhos internos por URLs absolutas do CDN
    const cdnBase = "http://localhost:8080/cdn/media";
    Object.keys(manifest.qualities).forEach((q) => {
      manifest.qualities[q] = `${cdnBase}/${id}/audio-${q}/`;
    });

    // 5️⃣ Retorna o manifest completo
    return reply.send(manifest);
  });

  // Nova rota para servir arquivos de áudio diretamente via servidor backend
  app.get("/media/:id/audio/:quality", async (req, reply) => {
    const { id, quality } = req.params as { id: string; quality: string };

    // Verifica se a mídia existe
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return reply.status(404).send({ error: "Media not found" });

    // Caminho para o arquivo de áudio completo
    const audioPath = path.join(
      process.cwd(),
      "mnt/data/media/chunks",
      id,
      `audio-${quality}`,
      "full.m4a"
    );

    if (!fs.existsSync(audioPath)) {
      return reply.status(404).send({ error: "Audio file not found" });
    }

    // Define o tipo MIME correto
    reply.type("audio/mp4");
    
    // Headers para suporte a range requests (seeking)
    const stat = await fs.promises.stat(audioPath);
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      
      reply.code(206);
      reply.headers({
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mp4',
      });
      
      const stream = fs.createReadStream(audioPath, { start, end });
      return reply.send(stream);
    } else {
      reply.headers({
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Content-Type': 'audio/mp4',
      });
      
      const stream = fs.createReadStream(audioPath);
      return reply.send(stream);
    }
  });
}
