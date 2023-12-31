import {useState} from 'react';
import {useCompletion} from 'ai/react';
import {Github, Wand2} from 'lucide-react';

import {http} from './lib/http';

import {Button} from './components/ui/button';
import {Separator} from './components/ui/separator';
import {Textarea} from './components/ui/textarea';
import {Label} from './components/ui/label';
import {Slider} from './components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select';

import {Video, VideoInputForm} from './components/video-input-form';
import {PromptSelect} from './components/prompt-select';

export function App() {
  const [temperature, setTemperature] = useState(0.5);
  const [video, setVideo] = useState<Video>();

  const {
    input,
    completion,
    isLoading,
    setInput,
    handleInputChange,
    handleSubmit,
  } = useCompletion({
    api: http.uri('/ai/completion'),
    headers: {
      ...http.config.headers,
      'Content-Type': 'application/json',
    },
    body: {
      videoId: video?.id,
      temperature,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-xl font-bold">upload.ai</h1>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Desenvolvido com 💜 no NLW da Rocketseat
          </span>

          <Separator orientation="vertical" className="h-6" />

          <Button className="gap-2" variant="outline">
            <Github className="h-4 w-4" />
            Github
          </Button>
        </div>
      </header>

      <main className="flex flex-1 gap-6 p-6">
        <div className="flex flex-1 flex-col">
          <div className="grid flex-1 grid-rows-2 gap-4">
            <Textarea
              className="resize-none p-5 leading-relaxed"
              placeholder="Inclua o prompt para a IA..."
              value={input}
              onChange={handleInputChange}
            />

            <Textarea
              className="resize-none p-5 leading-relaxed"
              placeholder="Resultado gerado pela IA..."
              value={completion}
              readOnly
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Lembre-se: Você pode utilizar a variável{' '}
            <code className="text-violet-500">{'{transcription}'}</code> no seu
            prompt para adicionar o conteúdo
          </p>
        </div>

        <aside className="flex w-80 flex-col gap-6">
          <VideoInputForm onVideoUploaded={setVideo} />

          <Separator />

          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label>Prompt</Label>

              <PromptSelect
                onPromptSelect={prompt => setInput(prompt.template)}
              />

              <span className="text-sm italic text-muted-foreground">
                Você poderá customizar essa opção em breve
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Modelo</Label>

              <Select defaultValue="gpt3.5" disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="gpt3.5">GPT 3.5-Turbo 16k</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-sm italic text-muted-foreground">
                Você poderá customizar essa opção em breve
              </span>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <Label>Temperatura</Label>

              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={value => setTemperature(value[0])}
              />

              <span className="text-sm italic text-muted-foreground">
                Valores mais altos tendem a deixar o resultado mais criativo,
                porém com possíveis erros.
              </span>
            </div>

            <Separator />

            <div>
              <Button
                className="w-full gap-2"
                type="submit"
                disabled={!video || isLoading}
              >
                Executar
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </aside>
      </main>
    </div>
  );
}
