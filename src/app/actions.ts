'use server';

import { generateCodeFromPrompt } from '@/ai/flows/generate-code-from-prompt';
import { provideContextualSuggestions } from '@/ai/flows/provide-contextual-suggestions';
import { summarizeCode } from '@/ai/flows/summarize-code';
import { refactorCode } from '@/ai/flows/refactor-code';
import { type FileAttachment } from '@/types';
import { provideInlineSuggestion } from '@/ai/flows/provide-inline-suggestion';

export async function getAiResponse(
  message: string,
  attachments: FileAttachment[]
): Promise<string> {
  try {
    if (attachments.length > 0) {
      const file = attachments[0]; // For simplicity, handle one attachment

      // The file content is now expected to be in the attachment object.
      const fileContent = file.content;
      if (file.type === 'file' && !fileContent) {
        return `Error: File content for ${file.name} was not provided. The extension may not have permission to read it.`;
      }

      if (file.type === 'file') {
        const lowerCaseMessage = message.toLowerCase();

        if (lowerCaseMessage.includes('summarize')) {
          const result = await summarizeCode({
            code: fileContent!,
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
            code: fileContent!,
            fileName: file.name,
            request: message,
          });
          return `\`\`\`tsx\n${result.refactoredCode}\n\`\`\``;
        }

        const result = await provideContextualSuggestions({
          currentFileContent: fileContent!,
          query: message,
        });
        return result.suggestion;
      }
    }

    const result = await generateCodeFromPrompt({ prompt: message });
    return `\`\`\`tsx\n${result.code}\n\`\`\``;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

export async function getInlineSuggestion(input: {
  line: string;
  fullContent: string;
  language: string;
}) {
  return provideInlineSuggestion(input);
}
