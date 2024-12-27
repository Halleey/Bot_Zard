import { handleReconnection } from './reconnectionHandler.js';

export const handleConnection = async (connectionUpdate, saveCreds) => {
    const { connection, lastDisconnect } = connectionUpdate;

    if (connection === 'open') {
        console.log('✅ Conexão estabelecida com sucesso!');
    } else if (connection === 'close') {
        await handleReconnection(lastDisconnect, saveCreds);
    }
};
