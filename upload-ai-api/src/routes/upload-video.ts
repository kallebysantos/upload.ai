import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";

import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";

import { prisma } from "../lib/prisma";

const MB = 1_048_576;

const pump = promisify(pipeline);

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 25 * MB,
    },
  });

  app.post("/videos", async (request, reply) => {
    const fileInfo = await request.file();

    if (!fileInfo) {
      return reply.status(400).send({ error: "Missing file input" });
    }

    const fileExtension = path.extname(fileInfo.filename);
    if (fileExtension !== ".mp3") {
      return reply
        .status(400)
        .send({ error: "Invalid input type, please upload a MP3 file." });
    }

    const fileBaseName = path.basename(fileInfo.filename, fileExtension);
    const fileUploadName = `${fileBaseName}-${randomUUID()}${fileExtension}`;
    const uploadPath = path.resolve(__dirname, "../../tmp", fileUploadName);

    await pump(fileInfo.file, fs.createWriteStream(uploadPath));

    const video = await prisma.video.create({
      data: {
        name: fileInfo.filename,
        path: uploadPath,
      },
    });

    return reply.send(video);
  });
}
