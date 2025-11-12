import prisma from "@streamLocal/db"
import type { FastifyInstance } from "fastify"
import fs from "fs"
import path from "path"

export async function uploadRoute(fastify: FastifyInstance) {
  fastify.post("/upload", async (request, reply) => {
    const file = await request.file()

    if (!file) {
      return reply.status(400).send({ error: "No file uploaded" })
    }

    const baseDir = path.join(process.cwd(), "mnt/data/media/originals")
    fs.mkdirSync(baseDir, { recursive: true })

    const fileName =  `${Date.now()}-${file.filename}`
    const filePath = path.join(baseDir, fileName)

    await fs.promises.writeFile(filePath, await file.toBuffer())

    const media = await prisma.media.create({
      data: {
        title: file.filename,
        filePath
      }
    })

    return reply.status(201).send({ media })
  })
}