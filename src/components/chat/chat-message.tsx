'use client';

import { type Message, type FileAttachment } from '@/types';
import { cn } from '@/lib/utils';
import { User, Bot, FileText, ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ChatMessageProps {
  message: Message;
}

const CodeBlock = ({ code }: { code: string }) => {
  return (
    <pre className='bg-background border border-border p-4 my-2 rounded-md font-code text-sm overflow-x-auto'>
      <code>{code}</code>
    </pre>
  );
};

const renderContent = (content: string) => {
  const codeBlockRegex = /```(?:[a-z]+)?\n([\s\S]*?)```/g;
  const parts = content.split(codeBlockRegex);

  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <CodeBlock
          key={index}
          code={part.trim()}
        />
      );
    }
    return part.split('\n').map((line, i) => (
      <p
        key={`${index}-${i}`}
        className='mb-2 last:mb-0'>
        {line}
      </p>
    ));
  });
};

const AttachmentBadge = ({ attachment }: { attachment: FileAttachment }) => (
  <Badge
    variant='secondary'
    className='mr-2 mb-2 font-code'>
    {attachment.type === 'image' ? (
      <ImageIcon className='mr-1 h-3 w-3' />
    ) : (
      <FileText className='mr-1 h-3 w-3' />
    )}
    {attachment.name}
  </Badge>
);

export function ChatMessage({ message }: ChatMessageProps) {
  const { role, content, attachments } = message;
  const isAssistant = role === 'assistant';

  return (
    <div
      className={cn(
        'flex items-start gap-3',
        !isAssistant && 'flex-row-reverse'
      )}>
      <Avatar className='h-8 w-8'>
        <AvatarFallback className='bg-transparent border border-border'>
          {isAssistant ? <Bot /> : <User />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'max-w-[75%] rounded-lg p-3 text-sm shadow-sm',
          isAssistant
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-primary text-primary-foreground'
        )}>
        {attachments && attachments.length > 0 && (
          <div className='mb-2'>
            {attachments.map((att, i) => (
              <AttachmentBadge
                key={i}
                attachment={att}
              />
            ))}
          </div>
        )}
        <div className='break-words'>
          {isAssistant && content === '...' ? (
            <div className='flex items-center gap-2 p-2'>
              <span className='h-2 w-2 animate-pulse rounded-full bg-current' />
              <span className='h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:0.2s]' />
              <span className='h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:0.4s]' />
            </div>
          ) : (
            renderContent(content)
          )}
        </div>
      </div>
    </div>
  );
}
