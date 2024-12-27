import { handleMessages } from './messageHandler.js';
import { handleConnection } from './connectionHandler.js';

export const connectHandlers = (sock, saveCreds) => {
    sock.ev.process(async (events) => {
        if (events['messages.upsert']) await handleMessages(events['messages.upsert'], sock);
        if (events['connection.update']) await handleConnection(events['connection.update'], saveCreds);
        if (events['creds.update']) await saveCreds();
    });
};
