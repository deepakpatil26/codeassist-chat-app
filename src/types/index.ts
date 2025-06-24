export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: 'file' | 'image';
  content?: string; // Content is fetched from VS Code before sending to AI
}

export const MOCK_FILES: FileAttachment[] = [
  { name: 'package.json', type: 'file' },
  { name: 'tailwind.config.ts', type: 'file' },
  { name: 'src/app/page.tsx', type: 'file' },
  { name: 'public/logo.png', type: 'image' },
  { name: 'README.md', type: 'file' },
];
