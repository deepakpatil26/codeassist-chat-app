'use client';

// A wrapper for communicating with the VS Code extension via an iframe bridge.
// This provides a clean interface for sending and receiving messages
// to and from the extension host.

let isVscodeEnvironment = false;
if (typeof window !== 'undefined') {
  // We are in a VS Code webview if we are inside an iframe.
  isVscodeEnvironment = window.self !== window.top;
}

const messageListeners = new Map<string, Set<(data: any) => void>>();
const requestCallbacks = new Map<string, (data: any) => void>();

// Listen for messages from the parent window (the VS Code webview bridge)
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    // A basic security check. In a real-world scenario, you might want to be more specific
    // about the origin, but for the VS Code webview host, this can be tricky.
    if (event.source !== window.parent) {
      return;
    }

    const message = event.data;

    // Handle one-time request responses
    if (message.requestId && requestCallbacks.has(message.requestId)) {
      requestCallbacks.get(message.requestId)!(message.data);
      requestCallbacks.delete(message.requestId);
      return;
    }

    // Handle subscription-based updates
    if (message.command) {
      const listeners = messageListeners.get(message.command);
      if (listeners) {
        listeners.forEach((callback) => callback(message.data));
      }
    }
  });
}

function postToParent(message: any) {
  if (isVscodeEnvironment) {
    // The targetOrigin should be '*' for vs-code webviews.
    window.parent.postMessage(message, '*');
  } else {
    console.log(
      'Not in a VS Code webview environment, message not sent:',
      message
    );
  }
}

function request<T>(command: string, data: any = {}): Promise<T> {
  if (!isVscodeEnvironment) {
    console.log(`VS Code API not found. Mocking response for "${command}".`);
    if (command === 'getWorkspaceFiles') {
      const mockFiles = [
        { name: 'mock/component.tsx', type: 'file' },
        { name: 'mock/image.png', type: 'image' },
        { name: 'mock/styles.css', type: 'file' },
      ];
      return Promise.resolve({ files: mockFiles } as T);
    }
    if (command === 'getFileContent') {
      const mockContent = `// Mock content for ${data.fileName}\nconsole.log("Hello, World!");`;
      return Promise.resolve({ content: btoa(mockContent) } as T);
    }
    return Promise.reject(new Error('Not in a VS Code webview environment.'));
  }

  return new Promise((resolve, reject) => {
    const requestId = `${command}-${Date.now()}-${Math.random()}`;
    requestCallbacks.set(requestId, (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
    // Post the message to the parent window (the bridge)
    postToParent({ command, data: { ...data, requestId } });
  });
}

function listen(command: string, callback: (data: any) => void): () => void {
  if (!messageListeners.has(command)) {
    messageListeners.set(command, new Set());
  }
  messageListeners.get(command)!.add(callback);
  return () => {
    messageListeners.get(command)?.delete(callback);
  };
}

// --- Public API ---

export type WorkspaceFile = {
  name: string;
  type: 'file' | 'image';
};

/**
 * Requests the content of a specific file from the VS Code workspace.
 * The content is expected to be Base64 encoded and is decoded to a UTF-8 string.
 * Use this for text-based files.
 */
export const getFileContent = (fileName: string): Promise<string> => {
  return request<{ content: string }>('getFileContent', { fileName }).then(
    (res) => {
      // Decode the Base64 content received from the extension back to a UTF-8 string.
      return atob(res.content);
    }
  );
};

/**
 * Requests the content of a specific file from the VS Code workspace
 * and returns it as a raw Base64 string.
 * Use this for binary files like images.
 */
export const getFileContentAsBase64 = (fileName: string): Promise<string> => {
  return request<{ content: string }>('getFileContent', { fileName }).then(
    (res) => res.content
  );
};

/**
 * Requests the list of all files in the VS Code workspace.
 */
export const getWorkspaceFiles = (): Promise<WorkspaceFile[]> => {
  return request<{ files: WorkspaceFile[] }>('getWorkspaceFiles').then(
    (res) => res.files || []
  );
};

/**
 * Subscribes to updates for the workspace file list from the extension.
 */
export const onWorkspaceFilesUpdate = (
  callback: (files: WorkspaceFile[]) => void
): (() => void) => {
  // The extension sends { files: [...] }. We need to pass that inner array to the callback.
  return listen('workspaceFiles', (data: { files: WorkspaceFile[] }) => {
    callback(data?.files || []);
  });
};

/**
 * Subscribes to new chat requests from the extension (e.g., from context menus).
 */
export const onNewChatRequest = (
  callback: (data: { fileName: string; prompt: string }) => void
): (() => void) => {
  return listen('startNewChat', callback);
};
