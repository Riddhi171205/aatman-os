import { sendWhatsAppMessage } from './integrations/whatsapp';
import { webSearch } from './integrations/websearch';

export async function dispatchCommand(command: string, args: any) {
    switch (command) {
        case 'send_whatsapp':
            // args: { to: string, message: string }
            return await sendWhatsAppMessage(args.to, args.message);
        case 'web_search':
            // args: { query: string }
            return await webSearch(args.query);
        default:
            throw new Error('Unknown command');
    }
}