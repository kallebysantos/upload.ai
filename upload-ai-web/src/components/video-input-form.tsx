import {ChangeEvent, FormEvent, useMemo, useRef, useState} from 'react';
import {FileVideo, Upload} from 'lucide-react';

import {getFFmpeg} from '@/lib/ffmpeg';

import {Label} from './ui/label';
import {Button} from './ui/button';
import {Textarea} from './ui/textarea';
import {Separator} from './ui/separator';
import {fetchFile} from '@ffmpeg/util';
import {http} from '@/lib/http';

type UploadVideoResponse = {
  id: string;
  name: string;
  path: string;
  transcription: string | null;
  created_at: Date;
};

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success';

type StatusMessage = {
  [key in Status]: string;
};

const statusMessages: StatusMessage = {
  waiting: 'Aguardando...',
  converting: 'Convertendo...',
  uploading: 'Carregando...',
  generating: 'Transcrevendo...',
  success: 'Sucesso!',
};

export function VideoInputForm() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('waiting');
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const previewURL = useMemo(() => {
    if (!videoFile) return null;

    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  async function convertVideoToAudio(video: File) {
    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile('input.mp4', await fetchFile(video));

    // ffmpeg.on('log', console.log);
    ffmpeg.on('progress', ({progress}) => {
      console.log('Convert progress: ' + Math.round(progress * 100));
    });

    await ffmpeg.exec([
      '-i',
      'input.mp4',
      '-map',
      '0:a',
      '-b:a',
      '20k',
      '-acodec',
      'libmp3lame',
      'output.mp3',
    ]);

    const audioData = await ffmpeg.readFile('output.mp3');
    const audioBlob = new Blob([audioData], {type: 'audio/mpeg'});
    const audioFile = new File([audioBlob], 'audio.mp3', {type: 'audio/mpeg'});

    console.log('Convert finished');

    return audioFile;
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const {files} = event.currentTarget;

    if (!files) return;

    const selectedFile = files.item(0);

    setVideoFile(selectedFile);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) return;

    setStatus('converting');

    const audioFile = await convertVideoToAudio(videoFile);

    setStatus('uploading');
    const uploadResponse = await http.upload<UploadVideoResponse>(
      '/videos',
      audioFile,
    );

    const {id: videoId} = await uploadResponse.json();

    setStatus('generating');
    const transcriptionResponse = await http.post(
      `/videos/${videoId}/transcription`,
      {prompt},
    );

    setStatus('success');
    console.log(transcriptionResponse);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleUpload}>
      <div>
        <label
          className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:border-ring hover:bg-primary/10"
          htmlFor="video"
        >
          {previewURL ? (
            <video
              className="pointer-events-none rounded-md border"
              src={previewURL}
              controls={false}
            />
          ) : (
            <>
              <FileVideo className="h-4 w-4" />
              Carregar video
            </>
          )}
        </label>

        <input
          className="sr-only"
          type="file"
          name="video"
          id="video"
          accept="video/mp4"
          onChange={handleFileChange}
        />
      </div>

      <Separator />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="transcription_prompt">Prompt para transcrição</Label>

          <Textarea
            className="h-20 resize-none leading-relaxed"
            ref={promptInputRef}
            disabled={status !== 'waiting'}
            id="transcription_prompt"
            placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula ( , )"
          />
        </div>

        <Button
          className="w-full gap-2 data-[status='success']:bg-emerald-500"
          data-status={status}
          disabled={status !== 'waiting'}
          type="submit"
        >
          {status === 'waiting' ? (
            <>
              Carregar vídeo
              <Upload className="h-4 w-4" />
            </>
          ) : (
            statusMessages[status]
          )}
        </Button>
      </div>
    </form>
  );
}
