import {useEffect, useState} from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {http} from '@/lib/http';

export type Prompt = {
  id: string;
  title: string;
  template: string;
};

type PromptSelectProps = {
  onPromptSelect: (prompt: Prompt) => void;
};

export function PromptSelect({onPromptSelect}: PromptSelectProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    http<Prompt[]>('/prompts')
      .then(response => response.json())
      .then(setPrompts);
  }, []);

  function handleValueChange(value: string) {
    const selectedPrompt = prompts.find(prompt => prompt.id === value);

    if (!selectedPrompt) return;

    onPromptSelect(selectedPrompt);
  }

  return (
    <Select onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um prompt..." />
      </SelectTrigger>

      <SelectContent>
        {prompts.map(({id, title}) => (
          <SelectItem key={id} value={id}>
            {title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
