import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { createSession, getUserFromSession } from '@/lib/session';


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, userInfo } = body;

        console.log('POST /api/users/profile - Request:', { walletAddress, userInfo });

        if (!walletAddress) {
            console.error('POST /api/users/profile - Missing wallet address');
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Validate wallet address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            console.error('POST /api/users/profile - Invalid wallet address format:', walletAddress);
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find or create user
        let user = await User.findOne({
            walletAddress: walletAddress.toLowerCase()
        });

        if (user) {
            // Update existing user
            user.email = userInfo?.email || user.email;
            user.name = userInfo?.name || user.name;
            user.profileImage = userInfo?.profileImage || user.profileImage;
            user.provider = userInfo?.provider || user.provider;
            user.web3AuthId = userInfo?.verifierId || user.web3AuthId;

            await user.save();
        } else {
            // Create new user
            user = await User.create({
                walletAddress: walletAddress.toLowerCase(),
                email: userInfo?.email,
                name: userInfo?.name,
                profileImage: userInfo?.profileImage,
                provider: userInfo?.provider || 'unknown',
                web3AuthId: userInfo?.verifierId,
                emailVerified: false,
            });
        }

        // Create session
        const token = await createSession(user);

        return NextResponse.json(
            {
                success: true,
                user: {
                    id: user._id,
                    walletAddress: user.walletAddress,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profileImage,
                    provider: user.provider,
                },
                token,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in /api/users/profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromSession();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                user: {
                    id: user._id,
                    walletAddress: user.walletAddress,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profileImage,
                    provider: user.provider,
                    emailVerified: user.emailVerified,
                    createdAt: user.createdAt,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error in GET /api/users/profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
