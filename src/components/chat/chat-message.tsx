'use client';

import { useState } from 'react';
import { type Message, type FileAttachment } from '@/types';
import { cn } from '@/lib/utils';
import {
  User,
  Bot,
  FileText,
  ImageIcon,
  ClipboardCopy,
  Download,
  Check,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { insertText } from '@/lib/vscode';

interface ChatMessageProps {
  message: Message;
}

const CodeBlock = ({ code, lang }: { code: string; lang: string }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    insertText(code);
    toast({
      title: 'Code inserted',
      description: 'The code has been inserted into your active editor.',
    });
  };

  return (
    <div className='my-2 rounded-md border bg-secondary/30 font-code text-sm'>
      <div className='flex items-center justify-between bg-secondary/50 px-4 py-1.5 border-b'>
        <span className='text-xs text-muted-foreground'>{lang || 'code'}</span>
        <div className='flex items-center gap-3'>
          <button
            onClick={handleInsert}
            className='text-muted-foreground hover:text-foreground transition-colors'
            title='Insert code at cursor'>
            <Download className='h-3.5 w-3.5' />
          </button>
          <button
            onClick={handleCopy}
            className='text-muted-foreground hover:text-foreground transition-colors'
            title='Copy code'>
            {copied ? (
              <Check className='h-3.5 w-3.5 text-green-500' />
            ) : (
              <ClipboardCopy className='h-3.5 w-3.5' />
            )}
          </button>
        </div>
      </div>
      <pre className='p-4 overflow-x-auto'>
        <code>{code}</code>
      </pre>
    </div>
  );
};

const renderContent = (content: string) => {
  const output: React.ReactNode[] = [];
  let lastIndex = 0;
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  for (const match of content.matchAll(codeBlockRegex)) {
    const [fullMatch, lang, code] = match;
    const matchIndex = match.index!;

    // Add text before the code block
    if (matchIndex > lastIndex) {
      const text = content.substring(lastIndex, matchIndex);
      output.push(
        text.split('\n').map((line, i) => (
          <p
            key={`text-${lastIndex}-${i}`}
            className='mb-2 last:mb-0'>
            {line}
          </p>
        ))
      );
    }

    // Add the code block
    output.push(
      <CodeBlock
        key={`code-${matchIndex}`}
        code={code.trim()}
        lang={lang}
      />
    );
    lastIndex = matchIndex + fullMatch.length;
  }

  // Add any remaining text after the last code block
  if (lastIndex < content.length) {
    const text = content.substring(lastIndex);
    output.push(
      text.split('\n').map((line, i) => (
        <p
          key={`text-final-${i}`}
          className='mb-2 last:mb-0'>
          {line}
        </p>
      ))
    );
  }

  // If no code blocks are found, render the whole thing as plain text
  if (output.length === 0) {
    return content.split('\n').map((line, i) => (
      <p
        key={`text-plain-${i}`}
        className='mb-2 last:mb-0'>
        {line}
      </p>
    ));
  }

  return output;
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
