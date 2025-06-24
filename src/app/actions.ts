'use server';

import generateCode from '@/ai/flows/generate-code-from-prompt';
import { provideContextualSuggestions } from '@/ai/flows/provide-contextual-suggestions';
import { summarizeCode } from '@/ai/flows/summarize-code';
import { refactorCode } from '@/ai/flows/refactor-code';
import { type FileAttachment } from '@/types';

// Mock function to get file content. In a real VS Code extension,
// this would use the VS Code API.
async function getFileContent(fileName: string): Promise<string> {
  const mockContent: { [key: string]: string } = {
    'package.json': `{
  "name": "codeassist-chat",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}`,
    'tailwind.config.ts': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};`,
    'src/app/page.tsx': `import { ChatLayout } from '@/components/chat/chat-layout';

export default function Home() {
  return (
    <div className="h-screen w-full">
      <ChatLayout />
    </div>
  );
}`,
    'README.md':
      '# CodeAssist Chat\nThis is a VS Code extension that integrates a React-based web chat interface.',
  };
  return mockContent[fileName] || `Content of ${fileName} not found.`;
}

export async function getAiResponse(
  message: string,
  attachments: FileAttachment[]
): Promise<string> {
  try {
    if (attachments.length > 0) {
      const file = attachments[0]; // For simplicity, handle one attachment
      if (file.type === 'file') {
        const fileContent = await getFileContent(file.name);
        const lowerCaseMessage = message.toLowerCase();

        if (lowerCaseMessage.includes('summarize')) {
          const result = await summarizeCode({
            code: fileContent,
            fileName: file.name,
          });
          return result.summary;
        }

        const refactorKeywords = [
          'refactor',
          'change',
          'update',
          'modify',
          'rewrite',
        ];
        if (
          refactorKeywords.some((keyword) => lowerCaseMessage.includes(keyword))
        ) {
          const result = await refactorCode({
            code: fileContent,
            fileName: file.name,
            request: message,
          });
          return `\`\`\`tsx\n${result.refactoredCode}\n\`\`\``;
        }

        const result = await provideContextualSuggestions({
          currentFileContent: fileContent,
          query: message,
        });
        return result.suggestion;
      }
    }

    const result = await generateCode({ prompt: message });
    return `\`\`\`tsx\n${result.code}\n\`\`\``;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}
