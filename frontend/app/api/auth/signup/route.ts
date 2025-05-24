import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import { userDb } from '@/lib/db';
import { JWT_SECRET, JWT_EXPIRY } from '@/lib/env';
import { users, User } from '@/lib/users-store';

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, role, organization } = await request.json();
    
    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, and role are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Check if user already exists in database
    const existingDbUser = await userDb.findUserByEmail(email);
    if (existingDbUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    // Also check in-memory users (for backward compatibility)
    const existingMemoryUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (existingMemoryUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user ID
    const userId = crypto.randomUUID();
    
    // Save user to database
    const dbUser = await userDb.createUser({
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      full_name,
      role,
      organization: organization || null
    });
    
    // Create user object for memory storage (for backward compatibility)
    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      password_hash: hashedPassword,
      full_name,
      role,
      organization: organization || null,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    };
    
    // Add to in-memory array (for backward compatibility)
    users.push(newUser);
    
    // Generate JWT token using jose
    const encoder = new TextEncoder();
    const token = await new SignJWT({ id: newUser.id, email: newUser.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(encoder.encode(JWT_SECRET));
    
    // Return success response (don't include password hash)
    const { password_hash, ...userResponse } = newUser;
    return NextResponse.json(
      {
        message: 'Successfully signed up!',
        token,
        user: userResponse
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 