import { NextResponse } from 'next/server'
import MailService from '@/lib/services/mailService'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { to, subject, content } = body

        // Validate required fields
        if (!to || !subject || !content) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Validate that 'to' is either a string or an array of strings
        const recipients = Array.isArray(to) ? to : [to]

        // Send email to each recipient
        await Promise.all(
            recipients.map(recipient =>
                MailService.send({
                    from: 'test@test.com',
                    to: recipient,
                    subject,
                    content
                })
            )
        )

        return NextResponse.json(
            { message: `Email sent successfully to ${recipients.length} recipient(s)` },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error sending email:', error)
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        )
    }
}
