# **App Name**: CodeAssist Chat

## Core Features

- React Chat UI: React-based web chat panel integrated into VS Code's WebView, supporting markdown and code highlighting.
- File Attachment: Enables file and image attachments in chat using `@filename` syntax, pulling files from the current workspace.
- AI Code Generation: Allows generating code snippets using the chat interface by invoking an external AI tool.
- Contextual Awareness: AI assistant maintains contextual awareness of the current VS Code workspace to provide more relevant and precise suggestions, using a tool.
- Data relay: The system should send attached file content or image metadata along with the chat message to the AI.

## Style Guidelines

- Primary color: Dark moderate blue (#5470C6) to give a professional but approachable vibe.
- Background color: Dark grayish blue (#282C34) for a dark theme that's easy on the eyes.
- Accent color: Light grayish cyan (#61AFEF) to highlight interactive elements without overwhelming the UI.
- Body and headline font: 'Inter', a sans-serif for clean readability in both UI elements and chat messages.
- Code font: 'Source Code Pro' for displaying code snippets and attached files in a monospace format.
- Minimalist layout focusing on chat readability. User/AI message bubbles, clear input field, and integrated file attachment UI.
- Subtle animations for new messages and file selections.
