import * as Schema from "yup";
import { createReadStream } from "node:fs";
import { FastifyInstance } from "fastify";

import { openai } from "../lib/openai";
import { isNotFoundError, prisma } from "../lib/prisma";

const requiredUUID = Schema.string().trim().default("").uuid().required();

const paramsSchema = Schema.object({
  videoId: requiredUUID,
});

const bodySchema = Schema.object({
  prompt: Schema.string(),
});

export async function createTranscriptionRoute(app: FastifyInstance) {
  app.post("/videos/:videoId/transcription", async (request, reply) => {
    try {
      const { videoId } = await paramsSchema.validate(request.params);

      const { prompt } = await bodySchema.validate(request.body);

      const video = await prisma.video.findUniqueOrThrow({
        where: { id: videoId },
      });

      const audioReadStream = createReadStream(video.path);

      const response = await openai.audio.transcriptions.create({
        file: audioReadStream,
        model: "whisper-1",
        language: "pt",
        response_format: "json",
        temperature: 0,
        prompt,
      });

      const transcription = response.text;

      await prisma.video.update({
        where: {
          id: videoId,
        },
        data: {
          transcription,
        },
      });

      return { transcription };
    } catch (err) {
      console.error(createTranscriptionRoute, err);

      if (err instanceof Schema.ValidationError) {
        return reply.status(400).send({ title: err.name, errors: err.errors });
      }

      if (isNotFoundError(err)) {
        return reply.status(404).send();
      }

      return reply.status(500).send();
    }
  });
}
