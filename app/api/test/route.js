// Add this at the top with other imports
import { Twilio } from 'twilio';
import { NextResponse } from 'next/server';

// Initialize Twilio client outside route handlers
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Test route
export async function GET() {
  try {
    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio phone number not configured');
    }

    const testMessage = await twilioClient.messages.create({
      body: '🚨 BOT TEST MESSAGE 🚨',
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+32465585370` // Replace with your number
    });

    return NextResponse.json({
      status: 'Test message sent',
      sid: testMessage.sid
    });
    
  } catch (error) {
    console.error('Twilio Test Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}