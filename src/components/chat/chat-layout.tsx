'use client';

import { useState } from 'react';
import { type Message, type FileAttachment } from '@/types';
import { getAiResponse } from '@/app/actions';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { getFileContent } from '@/lib/vscode';
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

  const handleSendMessage = async (
    content: string,
    attachments: FileAttachment[] // These attachments DON'T have content yet
  ) => {
    if (isSending) return;

    setIsSending(true);

    const assistantTypingMessage: Message = {
      id: String(Date.now() + 1),
      role: 'assistant',
      content: '...', // typing indicator
    };

    try {
      // Step 1: Fetch content for all attachments from the VS Code extension
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
              // Re-throw to stop the process
              throw new Error(`Failed to get content for ${att.name}`);
            }
          }
          // For images or files that might already have content
          return att;
        })
      );

      // Step 2: Add the user message to the UI
      const newMessage: Message = {
        id: String(Date.now()),
        role: 'user',
        content,
        attachments: attachmentsWithContent,
      };
      setMessages((prev) => [...prev, newMessage, assistantTypingMessage]);

      // Step 3: Call the AI with the complete data
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
      // Remove the typing indicator on failure
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
