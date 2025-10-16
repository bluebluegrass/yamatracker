// Utility for consistent API error responses
import { NextResponse } from 'next/server';

export function handleApiError(error: unknown, status: number = 500, details?: unknown) {
  let message = 'Unknown error';
  if (error instanceof Error) message = error.message;
  else if (typeof error === 'string') message = error;
  return NextResponse.json({
    success: false,
    error: message,
    details,
  }, { status });
}
