import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const response = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': process.env.BEARER_TOKEN
                    ? `Bearer ${process.env.BEARER_TOKEN}`
                    : '',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('GraphQL proxy error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from subgraph' },
            { status: 500 }
        );
    }
}
