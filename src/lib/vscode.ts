'use client';

// A wrapper for the VS Code API to be used in the webview.
// This provides a clean interface for sending and receiving messages
// to and from the extension host.

type VsCodeApi = {
  postMessage: (message: any) => void;
};

let vscode: VsCodeApi | null = null;

function getVscodeApi(): VsCodeApi | null {
  if (
    typeof window !== 'undefined' &&
    'acquireVsCodeApi' in window
  ) {
    if (!vscode) {
      vscode = (window as any).acquireVsCodeApi();
    }
  }
  return vscode;
}

const messageListeners = new Map<string, Set<(data: any) => void>>();
const requestCallbacks = new Map<string, (data: any) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const message = event.data; // The JSON data from the extension
    if (!message.command) return;

    // Handle one-time request responses
    if (message.requestId && requestCallbacks.has(message.requestId)) {
      requestCallbacks.get(message.requestId)!(message.data);
      requestCallbacks.delete(message.requestId);
      return;
    }

    // Handle general event listeners
    const listeners = messageListeners.get(message.command);
    if (listeners) {
      listeners.forEach((callback) => callback(message.data));
    }
  });
}

/**
 * Sends a message to the extension host and returns a promise that resolves with the response.
 * @param command The command to send.
 * @param data The data payload.
 * @returns A promise that resolves with the response data.
 */
function request<T>(command: string, data: any = {}): Promise<T> {
  const vsCodeApi = getVscodeApi();
  if (!vsCodeApi) {
    const mockFiles = [
      { name: 'mock/file1.ts', type: 'file' },
      { name: 'mock/image.png', type: 'image' },
    ];
    if (command === 'getWorkspaceFiles') {
      return Promise.resolve({ files: mockFiles } as T);
    }
    if (command === 'getFileContent') {
      return Promise.resolve({
        content: `// Mock content for ${data.fileName}`,
      } as T);
    }
    return Promise.reject(new Error('Not in a VS Code webview environment.'));
  }

  return new Promise((resolve) => {
    const requestId = `${command}-${Date.now()}-${Math.random()}`;
    requestCallbacks.set(requestId, resolve);
    vsCodeApi.postMessage({ command, data: { ...data, requestId } });
  });
}

/**
 * Adds a listener for a specific command from the extension.
 * @param command The command to listen for.
 * @param callback The function to call when the message is received.
 * @returns A function to remove the listener.
 */
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
 */
export const getFileContent = (fileName: string): Promise<string> => {
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
 * Listens for updates to the workspace files from the extension.
 */
export const onWorkspaceFilesUpdate = (
  callback: (files: WorkspaceFile[]) => void
) => {
  return listen('workspaceFiles', callback);
};
