'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, FileText, ImageIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MOCK_FILES, type FileAttachment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: FileAttachment[]) => void;
  isSending: boolean;
}

export function ChatInput({ onSendMessage, isSending }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.slice(-1) === '@') {
      setPopoverOpen(true);
    } else if (popoverOpen && !value.includes('@')) {
      setPopoverOpen(false);
    }
    setInput(value);
  };

  const handleFileSelect = (file: FileAttachment) => {
    setAttachments((prev) => [...prev, file]);
    setInput((prev) => prev.substring(0, prev.lastIndexOf('@')));
    setPopoverOpen(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (input.trim() || attachments.length > 0) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [containerRef]);

  return (
    <div
      className='p-4 border-t border-border bg-background'
      ref={containerRef}>
      <div className='relative max-w-4xl mx-auto'>
        {popoverOpen && (
          <div className='absolute bottom-full mb-2 w-[300px] z-10'>
            <Card className='shadow-lg'>
              <CardContent className='p-1 max-h-60 overflow-y-auto'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-xs text-muted-foreground p-2'>
                    Attach a file
                  </p>
                  {MOCK_FILES.filter(
                    (f) => !attachments.find((a) => a.name === f.name)
                  ).map((file) => (
                    <button
                      key={file.name}
                      onClick={() => handleFileSelect(file)}
                      className='flex items-center gap-2 p-2 rounded-md text-left text-sm hover:bg-accent hover:text-accent-foreground'>
                      {file.type === 'image' ? (
                        <ImageIcon className='h-4 w-4 flex-shrink-0' />
                      ) : (
                        <FileText className='h-4 w-4 flex-shrink-0' />
                      )}
                      <span className='font-code truncate'>{file.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div className='border rounded-lg p-2 flex flex-col'>
          {attachments.length > 0 && (
            <div className='flex flex-wrap gap-2 p-2 border-b'>
              {attachments.map((file, index) => (
                <Badge
                  key={index}
                  variant='secondary'
                  className='font-code items-center'>
                  {file.type === 'image' ? (
                    <ImageIcon className='mr-2 h-4 w-4' />
                  ) : (
                    <FileText className='mr-2 h-4 w-4' />
                  )}
                  {file.name}
                  <button
                    onClick={() =>
                      setAttachments((atts) =>
                        atts.filter((_, i) => i !== index)
                      )
                    }
                    className='ml-2 rounded-full hover:bg-destructive/20 p-0.5'>
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder='Type your message or use @ to attach a file...'
            className='pr-12 min-h-[60px] resize-none border-0 shadow-none focus-visible:ring-0 p-2'
            disabled={isSending}
          />
        </div>
        <Button
          type='submit'
          size='icon'
          className='absolute right-3 bottom-3'
          onClick={handleSend}
          disabled={isSending || (!input.trim() && attachments.length === 0)}>
          <Send className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
