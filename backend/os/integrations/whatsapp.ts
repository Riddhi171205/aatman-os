import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER!;

const client = twilio(accountSid, authToken);

export async function sendWhatsAppMessage(to: string, message: string) {
    try {
        const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: 'whatsapp:' + to,
        });
        console.log('Twilio WhatsApp send result:', result);
        return { sid: result.sid, status: result.status };
    } catch (error: any) {
        console.error('Twilio WhatsApp error:', error);
        throw error;
    }
}