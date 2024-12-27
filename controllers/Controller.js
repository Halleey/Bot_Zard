export const stickerController = async (socket, mensagemBaileys, botInfo) => {
    const { prefixo, nome_pack, nome_bot } = botInfo;

    const comandosInfo = botInfo.comandosInfo ? botInfo.comandosInfo() : {
        figurinhas: {
            s: {
                erro_tipo: 'Envie uma imagem ou vídeo para criar uma figurinha.',
                erro_duracao_video: 'Vídeo muito longo. Envie um vídeo com no máximo 9 segundos.',
            },
            simg: {
                erro_tipo: 'Envie um sticker para convertê-lo em imagem.',
            },
        },
        outros: {
            erro_comando: 'Comando inválido.',
            erro_comando_codigo: 'Erro ao processar comando: {comando}.',
        },
    };

    const { texto_recebido, tipo, mensagem, id_chat, citacao } = mensagemBaileys;

    const comando = texto_recebido ? texto_recebido.split(' ')[0] : '';
    const comandoSemPrefixo = comando ? comando.replace(prefixo, '').toLowerCase() : null;

    try {
        switch (comandoSemPrefixo) {
            case 's': // Criar figurinha
                await handleCriarSticker(socket, {
                    mensagemBaileys,
                    nome_pack,
                    nome_bot,
                    comandosInfo,
                });
                break;

            case 'simg': // Converter figurinha em imagem
                await handleStickerParaImagem(socket, {
                    mensagemBaileys,
                    comandosInfo,
                });
                break;

            case 'snome': // Renomear figurinha
                await handleRenomearSticker(socket, {
                    mensagemBaileys,
                    comandosInfo,
                });
                break;

            default:
                await socket.responderTexto(
                    null,
                    id_chat,
                    comandosInfo.outros.erro_comando,
                    mensagem
                );
        }
    } catch (err) {
        console.error('❌ Erro no stickerController:', err.message);
        await socket.responderTexto(
            null,
            id_chat,
            comandosInfo.outros.erro_comando_codigo.replace('{comando}', comando || 'desconhecido'),
            mensagem
        );
    }
};

const handleCriarSticker = async (
    socket,
    { mensagemBaileys, nome_pack, nome_bot, comandosInfo }
) => {
    const { tipo, mensagem, id_chat } = mensagemBaileys;
    const { mimetype, segundos } = mensagemBaileys.midia || {};

    if (tipo !== 'imageMessage' && tipo !== 'videoMessage') {
        return await socket.responderTexto(
            null,
            id_chat,
            comandosInfo.figurinhas.s.erro_tipo,
            mensagem
        );
    }

    if (tipo === 'videoMessage' && segundos > 9) {
        return await socket.responderTexto(
            null,
            id_chat,
            comandosInfo.figurinhas.s.erro_duracao_video,
            mensagem
        );
    }

    try {
        const bufferMidia = await downloadMediaMessage(mensagem, 'buffer');
        const { resultado: sticker } = await criarSticker(bufferMidia, {
            pack: nome_pack?.trim(),
            autor: nome_bot?.trim(),
        });

        await socket.enviarFigurinha(socket, id_chat, sticker);
    } catch (err) {
        console.error('❌ Erro ao criar figurinha:', err.message);
        throw new Error(`Erro ao processar figurinha: ${err.message}`);
    }
};

const handleStickerParaImagem = async (
    socket,
    { mensagemBaileys, comandosInfo }
) => {
    const { citacao, mensagem, id_chat } = mensagemBaileys;

    if (!citacao || citacao.tipo !== 'stickerMessage') {
        return await socket.responderTexto(
            null,
            id_chat,
            comandosInfo.figurinhas.simg.erro_tipo,
            mensagem
        );
    }

    try {
        const bufferSticker = await downloadMediaMessage(citacao.mensagem, 'buffer');
        const { resultado: imagem } = await stickerParaImagem(bufferSticker);

        await socket.responderArquivoBuffer(
            null,
            'imageMessage',
            id_chat,
            imagem,
            '',
            mensagem,
            'image/png'
        );
    } catch (err) {
        console.error('❌ Erro ao converter figurinha em imagem:', err.message);
        throw new Error(`Erro ao converter figurinha: ${err.message}`);
    }
};

const handleRenomearSticker = async (
    socket,
    { mensagemBaileys, comandosInfo }
) => {
    const { citacao, texto_recebido, mensagem, id_chat } = mensagemBaileys;

    if (!citacao || citacao.tipo !== 'stickerMessage') {
        return await socket.responderTexto(
            null,
            id_chat,
            comandosInfo.figurinhas.simg.erro_tipo,
            mensagem
        );
    }

    try {
        const [pack, autor] = texto_recebido.split(',').map((v) => v.trim());
        if (!pack || !autor) {
            return await socket.responderTexto(
                null,
                id_chat,
                comandosInfo.outros.erro_comando,
                mensagem
            );
        }

        const bufferSticker = await downloadMediaMessage(citacao.mensagem, 'buffer');
        const { resultado: sticker } = await renomearSticker(bufferSticker, pack, autor);

        await socket.enviarFigurinha(socket, id_chat, sticker);
    } catch (err) {
        console.error('❌ Erro ao renomear figurinha:', err.message);
        throw new Error(`Erro ao renomear figurinha: ${err.message}`);
    }
};
