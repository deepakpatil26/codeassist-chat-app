# VS Code Chat Assistant Extension

Develop a Visual Studio Code (VS Code) extension that integrates a React-based web chat interface. The chat assistant should support contextual awareness from the current code workspace, allow users to attach files and images via `@filename` mentions, and generate or manipulate code using an AI model.

**Key Features:**

1. **React Web UI Integration**

   - A web-based chat panel rendered using React inside a VS Code WebView.
   - Supports markdown, syntax-highlighted code blocks, and scrolling history.
   - Clean and minimal layout with support for user and AI messages.

2. **File and Image Attachment with `@` Syntax**

   - Typing `@filename` should allow selecting files from the workspace.
   - Attached files (text or image metadata) should be sent as part of the chat input.

3. **AI Code Generation**

   - The assistant should:

     - Generate new code from prompts.

   - Use OpenAI GPT or any suitable language model via API.

**Tech Stack:**

- Language: TypeScript
- Frontend: React (inside VS Code WebView)
- Backend/API: Node.js
- AI Model: OpenAI API (or equivalent)
- Tools: VS Code Extension API, WebView API
