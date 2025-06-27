'use server';
/**
 * @fileOverview AI flow to provide single-line code completions.
 *
 * - provideInlineSuggestion - A function that provides an inline code suggestion.
 * - ProvideInlineSuggestionInput - The input type for the function.
 * - ProvideInlineSuggestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProvideInlineSuggestionInputSchema = z.object({
  language: z.string().describe('The programming language of the code.'),
  line: z.string().describe('The current line of code the user is typing.'),
  fullContent: z.string().describe('The full content of the file for context.'),
});
export type ProvideInlineSuggestionInput = z.infer<
  typeof ProvideInlineSuggestionInputSchema
>;

const ProvideInlineSuggestionOutputSchema = z.object({
  suggestion: z.string().describe('The suggested code to complete the line.'),
});
export type ProvideInlineSuggestionOutput = z.infer<
  typeof ProvideInlineSuggestionOutputSchema
>;

export async function provideInlineSuggestion(
  input: ProvideInlineSuggestionInput
): Promise<ProvideInlineSuggestionOutput> {
  return provideInlineSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideInlineSuggestionPrompt',
  input: { schema: ProvideInlineSuggestionInputSchema },
  output: { schema: ProvideInlineSuggestionOutputSchema },
  prompt: `You are an expert programmer AI providing a single-line code completion.
The user is writing a file in {{language}}.
The full file content is:
\`\`\`
{{{fullContent}}}
\`\`\`

Complete the following line of code:
\`\`\`
{{{line}}}
\`\`\`
Only provide the code that should come after the cursor. Do not repeat the code that is already there. Do not add any explanation or markdown formatting.`,
});

const provideInlineSuggestionFlow = ai.defineFlow(
  {
    name: 'provideInlineSuggestionFlow',
    inputSchema: ProvideInlineSuggestionInputSchema,
    outputSchema: ProvideInlineSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
