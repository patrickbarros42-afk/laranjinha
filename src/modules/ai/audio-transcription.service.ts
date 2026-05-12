import { toFile } from "openai/uploads";

import { env } from "../../config/env.js";
import { openai } from "../../infra/openai/openai.client.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { DownloadedMedia } from "../../types/whatsapp.js";

export class AudioTranscriptionService {
  async transcribe(media: DownloadedMedia): Promise<string> {
    const file = await toFile(media.buffer, media.filename, {
      type: media.mimeType
    });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: env.OPENAI_TRANSCRIPTION_MODEL,
      language: "pt"
    });

    const text = transcription.text?.trim();

    if (!text) {
      throw new AppError("Não consegui transcrever esse áudio.", 422, "empty_audio_transcription");
    }

    return text;
  }
}
