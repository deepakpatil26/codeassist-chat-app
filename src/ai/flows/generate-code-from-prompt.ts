'use server';
/**
 * @fileOverview Summarizes a code file provided by the user.
 *
 * - summarizeCode - A function that summarizes the code file.
 * - SummarizeCodeInput - The input type for the summarizeCode function.
 * - SummarizeCodeOutput - The return type for the summarizeCode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeCodeInputSchema = z.object({
  code: z.string().describe('The code to summarize.'),
  fileName: z.string().describe('The name of the file containing the code.'),
});
export type SummarizeCodeInput = z.infer<typeof SummarizeCodeInputSchema>;

const SummarizeCodeOutputSchema = z.object({
  summary: z.string().describe('A summary of the code.'),
});
export type SummarizeCodeOutput = z.infer<typeof SummarizeCodeOutputSchema>;

export async function summarizeCode(
  input: SummarizeCodeInput
): Promise<SummarizeCodeOutput> {
  return summarizeCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCodePrompt',
  input: { schema: SummarizeCodeInputSchema },
  output: { schema: SummarizeCodeOutputSchema },
  prompt: `You are an expert software developer. Please summarize the following code file. Include the file name in the summary.\n\nFile Name: {{{fileName}}}\nCode: {{{code}}}`,
});

const summarizeCodeFlow = ai.defineFlow(
  {
    name: 'summarizeCodeFlow',
    inputSchema: SummarizeCodeInputSchema,
    outputSchema: SummarizeCodeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

// Example stub for generateCode (replace with your actual implementation)
export default async function generateCode({
  prompt,
}: {
  prompt: string;
}): Promise<{ code: string }> {
  // Implement your code generation logic here
  return { code: '// generated code based on prompt: ' + prompt };
}
