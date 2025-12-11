import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connection';
import Session from '@/lib/db/models/Session';
import User, { IUser } from '@/lib/db/models/User';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
);

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface SessionPayload {
    userId: string;
    walletAddress: string;
    sessionId: string;
}

/**
 * Create a new session for a user
 */
export async function createSession(user: IUser): Promise<string> {
    await connectDB();

    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    // Create JWT token
    const token = await new SignJWT({
        userId: user._id.toString(),
        walletAddress: user.walletAddress,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(JWT_SECRET);

    // Save session to database
    await Session.create({
        userId: user._id,
        token,
        expiresAt,
    });

    // Set httpOnly cookie
    (await cookies()).set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: expiresAt,
        path: '/',
    });

    return token;
}

/**
 * Verify and get session from token
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);

        await connectDB();

        // Verify session exists in database and hasn't expired
        const session = await Session.findOne({
            token,
            expiresAt: { $gt: new Date() },
        });

        if (!session) {
            return null;
        }

        return {
            userId: payload.userId as string,
            walletAddress: payload.walletAddress as string,
            sessionId: session._id.toString(),
        };
    } catch (error) {
        console.error('Session verification failed:', error);
        return null;
    }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(): Promise<void> {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (token) {
        await connectDB();
        await Session.deleteOne({ token });
    }

    // Clear cookie
    cookieStore.delete('session');
}

/**
 * Get user from session
 */
export async function getUserFromSession(): Promise<IUser | null> {
    const session = await getSession();

    if (!session) {
        return null;
    }

    await connectDB();
    const user = await User.findById(session.userId);
    return user;
}
