import { stickerController } from '../controllers/StickerController.js';

export const handleMediaMessage = async (msg, sock, mensagemBaileys) => {
    const contextoComando = msg.message?.contextInfo?.quotedMessage?.conversation;
    const textoRecebido = mensagemBaileys.texto;

    if (textoRecebido === '!s' || contextoComando?.toLowerCase() === '!s') {
        console.log('🟡 [DEBUG] Chamando stickerController para mídia marcada com !s.');
        await stickerController(sock, mensagemBaileys);
    } else {
        console.log('⚠️ [DEBUG] Mídia recebida sem comando relacionado. Ignorando.');
    }
};
