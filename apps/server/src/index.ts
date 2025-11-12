import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { uploadRoute } from "./routes/upload.route";
import { processRoute } from "./routes/process.route";
import { mediaRoute } from "./routes/media.route";
import { mediaListRoute } from "./routes/media-list.route";

const baseCorsConfig = {
	origin: ["http://localhost:3000"],
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
	credentials: true,
	maxAge: 86400,
};

const fastify = Fastify({
	logger: true,
});

fastify.register(multipart, {
	limits: {
		fileSize: 50 * 1024 * 1024, // 50 MB
	}
});
fastify.register(uploadRoute)
fastify.register(processRoute)
fastify.register(mediaRoute)
fastify.register(mediaListRoute)
fastify.register(fastifyCors, baseCorsConfig);

fastify.get("/", async () => {
	return "OK";
});

fastify.listen({ port: 3333 }, (err) => {
	if (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	console.log("Server running on port 3333");
});
