import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  
  const current = rateLimits.get(ip);
  
  if (!current || now > current.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages, model = 'demo' } = body;
    
    let responseContent: string;
    switch (model) {
      case 'groq':
        responseContent = '[Groq] Processing: ' + messages[messages.length - 1]?.content;
        break;
      case 'claude':
        responseContent = '[Claude] Processing: ' + messages[messages.length - 1]?.content;
        break;
      default:
        responseContent = 'Demo: ' + messages[messages.length - 1]?.content;
    }

    return NextResponse.json({
      content: responseContent,
      model,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Unable to process request' },
      { status: 500 }
    );
  }
}