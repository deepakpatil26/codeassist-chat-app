export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: 'file' | 'image';
  content?: string; // For text files on server-side
}

export const MOCK_FILES: FileAttachment[] = [
  { name: 'package.json', type: 'file' },
  { name: 'tailwind.config.ts', type: 'file' },
  { name: 'src/app/page.tsx', type: 'file' },
  { name: 'public/logo.png', type: 'image' },
  { name: 'README.md', type: 'file' },
];
