// Utility for consistent error handling in React hooks
export function handleHookError(
  error: unknown,
  addToast?: (message: string, type: 'error' | 'success' | 'info', duration?: number) => void,
  fallbackMsg = 'An error occurred'
) {
  let message = fallbackMsg;
  if (error instanceof Error) message = error.message;
  else if (typeof error === 'string') message = error;
  // Log error for debugging
  if (typeof window !== 'undefined') {
    console.error('Hook error:', error);
  }
  // Show toast if available
  if (addToast) addToast(message, 'error', 3000);
}
