'use server';
/**
 * @fileOverview AI flow to provide code suggestions based on the context of the current workspace.
 *
 * - provideContextualSuggestions - A function that handles the contextual code suggestion process.
 * - ProvideContextualSuggestionsInput - The input type for the provideContextualSuggestions function.
 * - ProvideContextualSuggestionsOutput - The return type for the provideContextualSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProvideContextualSuggestionsInputSchema = z.object({
  currentFileContent: z
    .string()
    .describe('The content of the currently opened file in the workspace.'),
  query: z.string().describe('The user query or request for code suggestion.'),
});
export type ProvideContextualSuggestionsInput = z.infer<
  typeof ProvideContextualSuggestionsInputSchema
>;

const ProvideContextualSuggestionsOutputSchema = z.object({
  suggestion: z
    .string()
    .describe(
      'The code suggestion based on the current file content and user query.'
    ),
});
export type ProvideContextualSuggestionsOutput = z.infer<
  typeof ProvideContextualSuggestionsOutputSchema
>;

export async function provideContextualSuggestions(
  input: ProvideContextualSuggestionsInput
): Promise<ProvideContextualSuggestionsOutput> {
  return provideContextualSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'provideContextualSuggestionsPrompt',
  input: { schema: ProvideContextualSuggestionsInputSchema },
  output: { schema: ProvideContextualSuggestionsOutputSchema },
  prompt:
    'You are an AI assistant specializing in providing code suggestions based on the context of the current workspace.\n\n' +
    'The user is currently editing the following file:\n\n' +
    '```\n{{{currentFileContent}}}\n```\n\n' +
    'The user has the following query:\n\n' +
    '"""\n{{{query}}}\n"""\n\n' +
    'Based on the file content and the query, provide a code suggestion that is relevant and precise. Focus on the current file and programming language.',
});

const provideContextualSuggestionsFlow = ai.defineFlow(
  {
    name: 'provideContextualSuggestionsFlow',
    inputSchema: ProvideContextualSuggestionsInputSchema,
    outputSchema: ProvideContextualSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
