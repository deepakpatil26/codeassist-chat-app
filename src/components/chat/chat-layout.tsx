'use client';

import { useState } from 'react';
import { type Message, type FileAttachment } from '@/types';
import { getAiResponse } from '@/app/actions';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';

export function ChatLayout() {
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
    attachments: FileAttachment[]
  ) => {
    if (isSending) return;

    setIsSending(true);
    const newMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content,
      attachments,
    };
    setMessages((prev) => [...prev, newMessage]);

    const assistantTypingMessage: Message = {
      id: String(Date.now() + 1),
      role: 'assistant',
      content: '...', // typing indicator
    };
    setMessages((prev) => [...prev, assistantTypingMessage]);

    try {
      const response = await getAiResponse(content, attachments);
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
        prev.map((msg) =>
          msg.id === assistantTypingMessage.id
            ? {
                ...msg,
                content: 'An error occurred while fetching the response.',
              }
            : msg
        )
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
