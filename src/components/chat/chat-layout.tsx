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
        'Hello! I am CodeAssist. I can help you generate, summarize, and refactor code. \n\nTo get started, try one of these: \n- Ask me to create a new component. \n- Attach a file with `@` and ask me to summarize it. \n- Attach a file and ask me to refactor it (e.g., "@src/app/page.tsx refactor to use a button").',
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
