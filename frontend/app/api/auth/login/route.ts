import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { userDb } from '@/lib/db';
import { JWT_SECRET, JWT_EXPIRY } from '@/lib/env';
import { users } from '@/lib/users-store';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Try to find user in database first
    let user = await userDb.findUserByEmail(email);
    
    // If not found in DB, try in-memory array (for backward compatibility)
    if (!user) {
      const memoryUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!memoryUser) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      user = memoryUser;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate JWT token using jose
    const encoder = new TextEncoder();
    const token = await new SignJWT({ id: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(encoder.encode(JWT_SECRET));
    
    // Return success response (don't include password hash)
    const { password_hash, ...userResponse } = user;
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 