'use client';

// A wrapper for the VS Code API to be used in the webview.
// This provides a clean interface for sending and receiving messages
// to and from the extension host.

type VsCodeApi = {
  postMessage: (message: any) => void;
};

// This is a global declaration for the acquireVsCodeApi function
// that is injected by VS Code into the webview's window object.
declare global {
  interface Window {
    acquireVsCodeApi: () => VsCodeApi;
  }
}

let vscode: VsCodeApi | null = null;

function getVscodeApi(): VsCodeApi | null {
  if (typeof window !== 'undefined' && 'acquireVsCodeApi' in window) {
    // Check if the API object has already been acquired
    if (!vscode) {
      vscode = window.acquireVsCodeApi();
    }
  }
  return vscode;
}

// We store listeners and request callbacks in maps to handle multiple
// messages and responses.
const messageListeners = new Map<string, Set<(data: any) => void>>();
const requestCallbacks = new Map<string, (data: any) => void>();

// A single, central event listener to handle all messages from the extension.
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const message = event.data; // The JSON data from the extension

    // If the message has a requestId, it's a response to a specific request.
    if (message.requestId && requestCallbacks.has(message.requestId)) {
      // Resolve the promise associated with this request.
      requestCallbacks.get(message.requestId)!(message.data);
      // Clean up the callback to prevent memory leaks.
      requestCallbacks.delete(message.requestId);
      return;
    }

    // If the message has a command, it's a general broadcast.
    if (message.command) {
      const listeners = messageListeners.get(message.command);
      if (listeners) {
        listeners.forEach((callback) => callback(message.data));
      }
    }
  });
}

/**
 * Sends a message to the extension host and returns a promise that resolves with the response.
 * This is used for request-response style communication.
 * @param command The command to send.
 * @param data The data payload.
 * @returns A promise that resolves with the response data.
 */
function request<T>(command: string, data: any = {}): Promise<T> {
  const vsCodeApi = getVscodeApi();

  // If we're not in a VS Code webview, we'll use mock data for local development.
  if (!vsCodeApi) {
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
      return Promise.resolve({ content: btoa(mockContent) } as T); // Base64 encode the mock content
    }
    return Promise.reject(new Error('Not in a VS Code webview environment.'));
  }

  // If we are in VS Code, we create a promise and send the message.
  return new Promise((resolve, reject) => {
    // Generate a unique ID for this request.
    const requestId = `${command}-${Date.now()}-${Math.random()}`;

    // Store the resolve function to be called when the response arrives.
    requestCallbacks.set(requestId, (response) => {
      if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });

    // Send the message to the extension host.
    vsCodeApi.postMessage({ command, data: { ...data, requestId } });
  });
}

/**
 * Adds a listener for a specific broadcast command from the extension.
 * @param command The command to listen for.
 * @param callback The function to call when the message is received.
 * @returns An unsubscribe function to remove the listener.
 */
function listen(command: string, callback: (data: any) => void): () => void {
  if (!messageListeners.has(command)) {
    messageListeners.set(command, new Set());
  }
  messageListeners.get(command)!.add(callback);

  // Return a function that can be called to remove this specific listener.
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
 * The content is expected to be Base64 encoded.
 */
export const getFileContent = (fileName: string): Promise<string> => {
  return request<{ content: string; error?: string }>('getFileContent', {
    fileName,
  }).then((res) => {
    if (res.error) {
      throw new Error(res.error);
    }
    // Decode the Base64 content back to a UTF-8 string.
    return atob(res.content);
  });
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
 * The callback will be invoked whenever files are added, deleted, or changed.
 */
export const onWorkspaceFilesUpdate = (
  callback: (data: { files: WorkspaceFile[] }) => void
): (() => void) => {
  return listen('workspaceFiles', callback);
};
