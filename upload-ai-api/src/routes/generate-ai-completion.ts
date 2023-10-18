import * as Schema from "yup";
import { FastifyInstance } from "fastify";

import { openai } from "../lib/openai";
import { isNotFoundError, prisma } from "../lib/prisma";

const requiredUUID = Schema.string().trim().default("").uuid().required();

const bodySchema = Schema.object({
  videoId: requiredUUID,
  template: Schema.string().trim().default("").required(),
  temperature: Schema.number().min(0).max(1).default(0.5).required(),
});

export async function generateAICompletionRoute(app: FastifyInstance) {
  app.post("/ai/completion", async (request, reply) => {
    try {
      const { videoId, template, temperature } = await bodySchema.validate(
        request.body
      );

      const video = await prisma.video.findUniqueOrThrow({
        where: { id: videoId },
      });

      if (!video.transcription) {
        return reply
          .status(400)
          .send({ error: "Video transcription was not generated yet." });
      }

      const promptMessage = template.replace(
        "{transcription}",
        video.transcription
      );

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo-16k",
        temperature,
        messages: [{ role: "user", content: promptMessage }],
      });

      return response;
    } catch (err) {
      console.error(generateAICompletionRoute, err);

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
