'use server';
/**
 * @fileOverview This file defines a Genkit flow for refactoring code based on a user request.
 *
 * - refactorCode - A function that takes code and a refactoring instruction and returns the modified code.
 * - RefactorCodeInput - The input type for the refactorCode function.
 * - RefactorCodeOutput - The return type for the refactorCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RefactorCodeInputSchema = z.object({
  code: z.string().describe('The source code to be refactored.'),
  fileName: z.string().describe('The name of the file containing the code.'),
  request: z
    .string()
    .describe("The user's instruction for how to refactor the code."),
});
export type RefactorCodeInput = z.infer<typeof RefactorCodeInputSchema>;

const RefactorCodeOutputSchema = z.object({
  refactoredCode: z.string().describe('The refactored code.'),
});
export type RefactorCodeOutput = z.infer<typeof RefactorCodeOutputSchema>;

export async function refactorCode(
  input: RefactorCodeInput
): Promise<RefactorCodeOutput> {
  return refactorCodeFlow(input);
}

const refactorCodePrompt = ai.definePrompt({
  name: 'refactorCodePrompt',
  input: { schema: RefactorCodeInputSchema },
  output: { schema: RefactorCodeOutputSchema },
  prompt: `You are an expert software engineer specializing in code refactoring.
Refactor the following code from the file '{{{fileName}}}' based on the user's request.
Only output the refactored code, without any additional explanation or markdown formatting.

Request: {{{request}}}

Original Code:
\`\`\`
{{{code}}}
\`\`\`
`,
});

const refactorCodeFlow = ai.defineFlow(
  {
    name: 'refactorCodeFlow',
    inputSchema: RefactorCodeInputSchema,
    outputSchema: RefactorCodeOutputSchema,
  },
  async (input) => {
    const { output } = await refactorCodePrompt(input);
    return output!;
  }
);
