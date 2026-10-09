import type { Editor, Range } from '@tiptap/core';
import type { UniversalEditor } from '../UniversalEditor';

export interface SlashCommandExecuteParams {
  editor: Editor;
  range: Range;
  coreEditor?: UniversalEditor;
}

export interface SlashCommandItem {
  id: string;
  title: string;
  description: string;
  aliases?: string[];
  group: 'Basic Blocks' | 'Rich Media' | 'Advanced' | string;
  icon: string;
  command: (params: SlashCommandExecuteParams) => void;
}

export interface SlashCommandsConfig {
  enabled?: boolean;
  commands?: SlashCommandItem[];
  suggestionChar?: string;
  maxSuggestions?: number;
  onCommandExecuted?: (item: SlashCommandItem) => void;
}
