'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Send,
  FileText,
  ImageIcon,
  X,
  Sparkles,
  Wand2,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type FileAttachment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  getWorkspaceFiles,
  onWorkspaceFilesUpdate,
  type WorkspaceFile,
  getFileContentAsBase64, // Use new function for previews
} from '@/lib/vscode';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (content: string, attachments: FileAttachment[]) => void;
  isSending: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Summarize', icon: Sparkles, text: 'Summarize this code.' },
  { label: 'Refactor', icon: Wand2, text: 'Refactor this code.' },
  { label: 'Explain', icon: Info, text: 'Explain this code.' },
];

export function ChatInput({ onSendMessage, isSending }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [filePreview, setFilePreview] = useState<{ [name: string]: string }>(
    {}
  );
  const [fileListIndex, setFileListIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getWorkspaceFiles().then(setWorkspaceFiles);
    const unsubscribe = onWorkspaceFilesUpdate(setWorkspaceFiles);
    return () => unsubscribe();
  }, []);

  // Fetch image previews for image attachments
  useEffect(() => {
    attachments.forEach(async (file) => {
      if (file.type === 'image' && !filePreview[file.name]) {
        try {
          // Use the new function to get raw base64 content
          const base64Content = await getFileContentAsBase64(file.name);
          setFilePreview((prev) => ({
            ...prev,
            [file.name]: `data:image/png;base64,${base64Content}`,
          }));
        } catch {
          // ignore if preview fails
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const atIndex = value.lastIndexOf('@');

    if (atIndex !== -1 && !value.substring(atIndex + 1).includes(' ')) {
      setPopoverOpen(true);
    } else {
      setPopoverOpen(false);
    }

    setInput(value);
    setFileListIndex(0);
  };

  const handleFileSelect = (file: WorkspaceFile) => {
    setAttachments((prev) => [...prev, file]);
    setInput((prev) => prev.substring(0, prev.lastIndexOf('@')) + ' ');
    setPopoverOpen(false);
    setFileListIndex(0);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (input.trim() || attachments.length > 0) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
      // Refocus after state update
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (popoverOpen && filteredFiles.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFileListIndex((i) => (i + 1) % filteredFiles.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFileListIndex(
          (i) => (i - 1 + filteredFiles.length) % filteredFiles.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleFileSelect(filteredFiles[fileListIndex]);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
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

  // --- Filtering Logic ---
  const atIndex = input.lastIndexOf('@');
  const isSearching = popoverOpen && atIndex !== -1;
  const searchTerm = isSearching
    ? input.substring(atIndex + 1).toLowerCase()
    : '';

  const filteredFiles = isSearching
    ? workspaceFiles.filter(
        (f) =>
          !attachments.find((a) => a.name === f.name) &&
          f.name.toLowerCase().includes(searchTerm)
      )
    : [];

  const handleQuickAction = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  return (
    <div
      className='p-4 border-t border-border bg-background'
      ref={containerRef}>
      <div className='relative max-w-4xl mx-auto'>
        <div className='flex flex-wrap items-center gap-2 mb-2'>
          {QUICK_ACTIONS.map(({ label, icon: Icon, text }) => (
            <Button
              key={label}
              type='button'
              variant='outline'
              size='sm'
              aria-label={label}
              onClick={() => handleQuickAction(text)}
              className='flex items-center gap-1 text-xs text-muted-foreground'
              tabIndex={0}>
              <Icon className='h-3 w-3' />
              {label}
            </Button>
          ))}
        </div>
        {popoverOpen && (
          <div className='absolute bottom-full mb-2 w-[300px] z-10'>
            <Card className='shadow-lg'>
              <CardContent className='p-1 max-h-60 overflow-y-auto'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-xs text-muted-foreground p-2'>
                    {searchTerm
                      ? `Results for "${searchTerm}"`
                      : 'Attach a file from your workspace'}
                  </p>
                  {filteredFiles.length > 0 ? (
                    filteredFiles.slice(0, 50).map((file, idx) => (
                      <button
                        key={file.name}
                        onClick={() => handleFileSelect(file)}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md text-left text-sm hover:bg-accent hover:text-accent-foreground',
                          fileListIndex === idx &&
                            'bg-accent text-accent-foreground'
                        )}
                        aria-label={`Attach ${file.name}`}
                        tabIndex={0}>
                        {file.type === 'image' ? (
                          <ImageIcon className='h-4 w-4 flex-shrink-0' />
                        ) : (
                          <FileText className='h-4 w-4 flex-shrink-0' />
                        )}
                        <span className='font-code truncate'>{file.name}</span>
                      </button>
                    ))
                  ) : (
                    <p className='text-xs text-muted-foreground p-2 text-center'>
                      {workspaceFiles.length === 0
                        ? 'Loading files...'
                        : 'No files found.'}
                    </p>
                  )}
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
                  className='font-code items-center'
                  aria-label={`Attached ${file.name}`}>
                  {file.type === 'image' ? (
                    <ImageIcon className='mr-2 h-4 w-4 shrink-0' />
                  ) : (
                    <FileText className='mr-2 h-4 w-4 shrink-0' />
                  )}
                  {filePreview[file.name] && (
                    <img
                      src={filePreview[file.name]}
                      alt={file.name}
                      className='h-4 w-4 mr-1 rounded-sm inline-block object-cover'
                    />
                  )}
                  <span>{file.name}</span>
                  <button
                    onClick={() =>
                      setAttachments((atts) =>
                        atts.filter((_, i) => i !== index)
                      )
                    }
                    className='ml-2 rounded-full hover:bg-destructive/20 p-0.5'
                    aria-label={`Remove ${file.name}`}>
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
            aria-label='Chat input'
          />
        </div>
        <Button
          type='submit'
          size='icon'
          className='absolute right-3 bottom-3'
          onClick={handleSend}
          disabled={isSending || (!input.trim() && attachments.length === 0)}
          aria-label='Send message'>
          <Send className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
