// Implemented the Genkit flow for generating code from a prompt.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating code from a textual description.
 *
 * - generateCodeFromPrompt - A function that takes a text prompt and returns generated code.
 * - GenerateCodeInput - The input type for the generateCodeFromPrompt function.
 * - GenerateCodeOutput - The return type for the generateCodeFromPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCodeInputSchema = z.object({
  prompt: z.string().describe('A textual description of the code to generate.'),
});
export type GenerateCodeInput = z.infer<typeof GenerateCodeInputSchema>;

const GenerateCodeOutputSchema = z.object({
  code: z.string().describe('The generated code.'),
});
export type GenerateCodeOutput = z.infer<typeof GenerateCodeOutputSchema>;

export async function generateCodeFromPrompt(
  input: GenerateCodeInput
): Promise<GenerateCodeOutput> {
  return generateCodeFlow(input);
}

const generateCodePrompt = ai.definePrompt({
  name: 'generateCodePrompt',
  input: { schema: GenerateCodeInputSchema },
  output: { schema: GenerateCodeOutputSchema },
  prompt: `You are an expert software engineer. Generate code based on the following description:\n\n{{{prompt}}}`,
});

const generateCodeFlow = ai.defineFlow(
  {
    name: 'generateCodeFlow',
    inputSchema: GenerateCodeInputSchema,
    outputSchema: GenerateCodeOutputSchema,
  },
  async (input) => {
    const { output } = await generateCodePrompt(input);
    return output!;
  }
);
