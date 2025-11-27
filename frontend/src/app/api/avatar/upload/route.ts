// src/app/api/avatar/upload/route.ts
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// Create a custom alphabet for generating random strings (e.g., for filenames)
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7,
);

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const file = request.body || '';
  const contentType = request.headers.get('content-type') || 'text/plain';
  const filename = `${nanoid()}.${contentType.split('/')[1]}`;

  try {
    const blob = await put(filename, file, {
      contentType,
      access: 'public',
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return new NextResponse(JSON.stringify({ message: errorMessage }), {
      status: 500,
    });
  }
}
