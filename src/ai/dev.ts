import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-code.ts';
import '@/ai/flows/generate-code-from-prompt.ts';
import '@/ai/flows/provide-contextual-suggestions.ts';
import '@/ai/flows/refactor-code.ts';
import '@/ai/flows/provide-inline-suggestion.ts';
