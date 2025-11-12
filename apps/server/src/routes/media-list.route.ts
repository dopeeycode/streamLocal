import prisma from "@streamLocal/db";
import type { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";

export async function mediaListRoute(app: FastifyInstance) {
  // Listar todas as mídias
  app.get("/media", async (req, reply) => {
    try {
      const medias = await prisma.media.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      return reply.send(medias);
    } catch (error) {
      return reply.status(500).send({ 
        error: "Erro ao buscar mídias",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Buscar informações de uma mídia específica
  app.get("/media/:id/info", async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const media = await prisma.media.findUnique({ where: { id } });
      
      if (!media) {
        return reply.status(404).send({ error: "Media not found" });
      }
      
      return reply.send(media);
    } catch (error) {
      return reply.status(500).send({ 
        error: "Erro ao buscar mídia",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Deletar uma mídia
  app.delete("/media/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    try {
      const media = await prisma.media.findUnique({ where: { id } });
      
      if (!media) {
        return reply.status(404).send({ error: "Media not found" });
      }

      // Deletar arquivos físicos
      try {
        // Deletar arquivo original
        if (fs.existsSync(media.filePath)) {
          await fs.promises.unlink(media.filePath);
        }

        // Deletar pasta de chunks processados
        const chunksDir = path.join(
          process.cwd(),
          "mnt/data/media/chunks",
          id
        );
        if (fs.existsSync(chunksDir)) {
          await fs.promises.rm(chunksDir, { recursive: true, force: true });
        }
      } catch (fileError) {
        console.warn("Erro ao deletar arquivos físicos:", fileError);
        // Continua mesmo se houver erro na exclusão de arquivos
      }

      // Deletar do banco de dados
      await prisma.media.delete({ where: { id } });
      
      return reply.send({ message: "Mídia deletada com sucesso" });
    } catch (error) {
      return reply.status(500).send({ 
        error: "Erro ao deletar mídia",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}