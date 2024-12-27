import { downloadMediaMessage } from '@whiskeysockets/baileys';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';

/**
 * Controlador para criar figurinhas a partir de mídias enviadas usando FFmpeg.
 * @param {Object} sock - Instância do WhatsApp.
 * @param {Object} mensagem - Dados da mensagem recebida.
 * @param {Object} options - Opções adicionais, como funções utilitárias.
 */
export async function stickerController(sock, mensagem, options) {
    const { idChat, mensagemOriginal } = mensagem;
    const { responderTexto } = options;

    console.log('📩 [DEBUG] Entrando no stickerController com a mensagem:', mensagem);

    const tempInputPath = path.resolve('./downloads', `input_${Date.now()}.mp4`);
    const tempOutputPath = path.resolve('./downloads', `output_${Date.now()}.webp`);

    try {
        const media = mensagemOriginal.message?.imageMessage || mensagemOriginal.message?.videoMessage;

        if (!media) {
            console.log('❌ [DEBUG] Nenhuma mídia detectada na mensagem.');
            await responderTexto(idChat, 'Por favor, envie uma imagem ou vídeo junto com o comando !s.', mensagemOriginal);
            return;
        }

        console.log('✅ [DEBUG] Mídia detectada! Tipo:', media.mimetype || 'Indefinido');

        const buffer = await downloadMediaMessage(mensagemOriginal, 'buffer', {});
        if (!buffer) {
            console.error('❌ [DEBUG] Falha ao baixar a mídia.');
            await responderTexto(idChat, 'Não foi possível baixar a mídia. Tente novamente.', mensagemOriginal);
            return;
        }

        console.log('🟡 [DEBUG] Salvando mídia temporária...');
        await writeFile(tempInputPath, buffer);

        console.log('🟡 [DEBUG] Iniciando conversão com FFmpeg...');
        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
            .outputOptions([
                '-vf', 'scale=512:512',
                '-t', '6', // Duração máxima
                '-c:v', 'libwebp',
                '-q:v', '50',
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
            ])
                .toFormat('webp')
                .save(tempOutputPath)
                .on('end', () => {
                    console.log('✅ [DEBUG] Conversão finalizada com sucesso.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ [DEBUG] Erro durante a conversão:', err);
                    reject(err);
                });
        });

        console.log('🟡 [DEBUG] Enviando figurinha para:', idChat);
        const stickerBuffer = await readFile(tempOutputPath);

        // Adiciona metadados para a figurinha
        const stickerMetadata = {
            packname: 'Zardelas', // Nome do pacote de figurinhas
            author: 'Zard', // Nome do autor
        };

        // Envia a figurinha com metadados
        await sock.sendMessage(
            idChat,
            {
                sticker: {
                    url: tempOutputPath,
                },
                mimetype: 'image/webp',
                ...stickerMetadata,
            },
            { quoted: mensagemOriginal }
        );

        console.log('✅ [DEBUG] Figurinha enviada com sucesso com metadados!');
    } catch (error) {
        console.error('❌ [DEBUG] Erro no stickerController:', error);
        await responderTexto(idChat, 'Houve um erro ao criar a figurinha. Verifique se o vídeo ou imagem é válido.', mensagemOriginal);
    } finally {
        try {
            console.log('🟡 [DEBUG] Apagando arquivos temporários...');
            await unlink(tempInputPath);
            await unlink(tempOutputPath);
            console.log('✅ [DEBUG] Arquivos temporários apagados com sucesso.');
        } catch (err) {
            console.error('❌ [DEBUG] Erro ao apagar arquivos temporários:', err);
        }
    }
}
