'use client';

import { useState, useEffect } from 'react';
import { type Message, type FileAttachment } from '@/types';
import { getAiResponse, getInlineSuggestion } from '@/app/actions';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import {
  getFileContent,
  onNewChatRequest,
  onInlineCompletionRequest,
  sendInlineCompletionResult,
} from '@/lib/vscode';
import { useToast } from '@/hooks/use-toast';

export function ChatLayout() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm CodeAssist, your AI pair programmer. Here's how I can help you:\n\n" +
        '**1. Inline Code Suggestions**\n' +
        "Just like GitHub Copilot, I'll automatically provide single-line completions as you type.\n" +
        '- Suggestions appear as ghost text.\n' +
        '- Press `Tab` to accept them.\n\n' +
        '**2. Powerful Chat & Code Blocks**\n' +
        '- **Ask anything:** Generate, refactor, or explain code.\n' +
        '- **Attach files:** Use `@` to add workspace files to your prompt for context.\n' +
        '- **Use code blocks:** When I provide code, you can now click the icons to **Copy** it or **Insert** it directly into your active editor.\n\n' +
        '**3. Right-Click Actions**\n' +
        'Right-click on any file in the editor or explorer and select **Summarize** or **Refactor** to start a new chat with that file as context.',
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  // Listen for commands from the VS Code extension (e.g., right-click menus)
  useEffect(() => {
    const unsubscribe = onNewChatRequest(({ fileName, prompt }) => {
      const attachment: FileAttachment = { name: fileName, type: 'file' };
      handleSendMessage(prompt, [attachment]);
    });
    return () => unsubscribe();
  }, []);

  // Listen for inline completion requests from the extension
  useEffect(() => {
    const unsubscribe = onInlineCompletionRequest(async (data) => {
      try {
        const fullContent = await getFileContent(data.fileName);
        const result = await getInlineSuggestion({
          line: data.line,
          fullContent: fullContent,
          language: data.language,
        });
        sendInlineCompletionResult(result.suggestion);
      } catch (error) {
        console.error('Inline suggestion failed:', error);
        sendInlineCompletionResult(''); // Send empty on error
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (
    content: string,
    attachments: FileAttachment[]
  ) => {
    if (isSending) return;

    setIsSending(true);

    const assistantTypingMessage: Message = {
      id: String(Date.now() + 1),
      role: 'assistant',
      content: '...', // typing indicator
    };

    try {
      const attachmentsWithContent = await Promise.all(
        attachments.map(async (att) => {
          if (att.type === 'file' && !att.content) {
            try {
              const fileContent = await getFileContent(att.name);
              return { ...att, content: fileContent };
            } catch (error) {
              console.error(`Failed to get content for ${att.name}`, error);
              toast({
                variant: 'destructive',
                title: `Error reading file: ${att.name}`,
                description: 'Could not read the file from the workspace.',
              });
              throw new Error(`Failed to get content for ${att.name}`);
            }
          }
          return att;
        })
      );

      const newMessage: Message = {
        id: String(Date.now()),
        role: 'user',
        content,
        attachments: attachmentsWithContent,
      };
      setMessages((prev) => [...prev, newMessage, assistantTypingMessage]);

      const response = await getAiResponse(content, attachmentsWithContent);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantTypingMessage.id
            ? { ...msg, content: response }
            : msg
        )
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantTypingMessage.id)
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='flex flex-col h-full bg-background relative'>
      <header className='p-4 border-b shrink-0'>
        <h1 className='text-lg font-semibold text-center'>CodeAssist</h1>
      </header>
      <div className='flex-1 overflow-y-auto'>
        <ChatMessages messages={messages} />
      </div>
      <ChatInput
        onSendMessage={handleSendMessage}
        isSending={isSending}
      />
    </div>
  );
}
