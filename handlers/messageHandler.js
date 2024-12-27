import { handleMediaMessage } from './mediaHandler.js';
import { handleWelcomeMessage } from '../controllers/Menu.js';
import { stickerController } from '../controllers/StickerController.js';
import { MusicController } from '../controllers/MusicController.js'; // Importa o controlador de músicas

const PREFIX = '!';
export const handleMessages = async (upsert, sock) => {
    try {
        const messages = upsert.messages;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const tipoMensagem = Object.keys(msg.message)[0];
            const textoRecebido = extractText(msg);
            const idChat = msg.key.remoteJid;
            const isGroup = idChat.endsWith('@g.us');

            const mensagemBaileys = {
                tipo: tipoMensagem,
                texto: textoRecebido.trim(),
                idChat,
                isGroup,
                mensagemOriginal: msg,
            };

            console.log('📩 Mensagem recebida:', mensagemBaileys);

            const comando = textoRecebido.trim().toLowerCase();

            // Verifique se a mensagem é um comando
            if (!comando.startsWith(PREFIX)) {
                console.log('⚠️ [DEBUG] Mensagem ignorada (não é um comando):', comando);
                continue;
            }

            // Função para enviar respostas
            const responderTexto = async (idChat, texto, mensagemOriginal) => {
                try {
                    await sock.sendMessage(idChat, { text: texto }, { quoted: mensagemOriginal });
                } catch (error) {
                    console.error('❌ Erro ao enviar mensagem de texto:', error);
                }
            };

            // Roteamento de comandos
            if (comando.startsWith(`${PREFIX}s`)) {
                console.log('🟡 [DEBUG] Chamando stickerController para comando explícito.');
                await stickerController(sock, mensagemBaileys, { responderTexto });
            } 
            
            else if (comando.startsWith(`${PREFIX}menu`)) {
                console.log('🟡 [DEBUG] Chamando handleWelcomeMessage para !menu.');
                await handleWelcomeMessage(sock, mensagemBaileys);
            } 
            
            else if (comando.startsWith(`${PREFIX}play`)) {
                console.log('🟡 [DEBUG] Chamando MusicController para !play.');
                await MusicController(sock, mensagemBaileys, { responderTexto });
            } 
            
            else if (['imageMessage', 'videoMessage'].includes(tipoMensagem)) {
                await handleMediaMessage(msg, sock, mensagemBaileys);
            } 

            // Ignorar comandos desconhecidos
            else {
                console.log('⚠️ [DEBUG] Comando desconhecido:', comando);
                // Não enviar nenhuma resposta ao usuário
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagens:', error);
    }
};

const extractText = (msg) => {
    return (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        ''
    );
};
