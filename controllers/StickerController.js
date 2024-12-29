import { downloadMediaMessage } from '@whiskeysockets/baileys';
import ffmpeg from 'fluent-ffmpeg';
import { writeFile, readFile, unlink } from 'fs/promises';
import path from 'path';

/**
 * Controlador para criar figurinhas a partir de mídias enviadas usando FFmpeg.
 * Suporta figurinhas animadas e ajusta a mídia para preencher totalmente o quadro.
 * @param {Object} sock - Instância do WhatsApp.
 * @param {Object} mensagem - Dados da mensagem recebida.
 * @param {Object} options - Opções adicionais, como funções utilitárias.
 */
export async function stickerController(sock, mensagem, options) {
    const { idChat, mensagemOriginal } = mensagem;
    const { responderTexto } = options;

    console.log('📩 [DEBUG] Entrando no stickerController com a mensagem:', mensagem);

    const tempInputPath = path.resolve('./downloads', `input_${Date.now()}.mp4`).replace(/\\/g, '/');
    const tempOutputPath = path.resolve('./downloads', `output_${Date.now()}.webp`).replace(/\\/g, '/');

    try {
        const media = mensagemOriginal.message?.imageMessage || mensagemOriginal.message?.videoMessage;

        if (!media) {
            console.log('❌ [DEBUG] Nenhuma mídia detectada na mensagem.');
            await responderTexto(idChat, 'Por favor, envie uma imagem ou vídeo junto com o comando !s.', mensagemOriginal);
            return;
        }

        console.log('✅ [DEBUG] Mídia detectada! Tipo:', media.mimetype || 'Indefinido');

        // Baixar a mídia
        const buffer = await downloadMediaMessage(mensagemOriginal, 'buffer', {});
        if (!buffer) {
            console.error('❌ [DEBUG] Falha ao baixar a mídia.');
            await responderTexto(idChat, 'Não foi possível baixar a mídia. Tente novamente.', mensagemOriginal);
            return;
        }

        // Salvar a mídia temporária
        console.log('🟡 [DEBUG] Salvando mídia temporária...');
        await writeFile(tempInputPath, buffer);

        // Extrair comando do texto
        const comando = mensagem.texto.trim().toLowerCase();

        if (comando === '!s') {
            // Gerar figurinha estática
            console.log('✅ Gerando figurinha estática...');
            await createStaticSticker(tempInputPath, tempOutputPath);
        } else if (comando === '!ss') {
            // Gerar figurinha animada
            console.log('✅ Gerando figurinha animada...');
            await createAnimatedSticker(tempInputPath, tempOutputPath);
        } else {
            console.log('❌ Comando inválido.');
            await responderTexto(idChat, 'Comando inválido. Use !s para estático ou !ss para animado.', mensagemOriginal);
            return;
        }

        // Enviar a figurinha gerada
        console.log('🟡 [DEBUG] Enviando figurinha para:', idChat);
        const stickerBuffer = await readFile(tempOutputPath);

        const stickerMetadata = {
            packname: 'Zardelas',
            author: 'Zard',
        };

        await sock.sendMessage(
            idChat,
            {
                sticker: stickerBuffer,
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
            // Apagar arquivos temporários
            console.log('🟡 [DEBUG] Apagando arquivos temporários...');
            await Promise.all([unlink(tempInputPath).catch(() => {}), unlink(tempOutputPath).catch(() => {})]);
            console.log('✅ [DEBUG] Arquivos temporários apagados com sucesso.');
        } catch (err) {
            console.error('❌ [DEBUG] Erro ao apagar arquivos temporários:', err);
        }
    }
}

/**
 * Gera uma figurinha estática a partir do vídeo.
 * @param {string} videoPath - Caminho do arquivo de entrada.
 * @param {string} outputPath - Caminho do arquivo de saída.
 */
async function createStaticSticker(videoPath, outputPath) {
    await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([
                // Ajuste para garantir que a imagem sempre ocupe 512x512 sem cortar
                '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2', // Ajuste para não cortar
                // Caso a imagem seja menor, ela será esticada para o tamanho 512x512
                '-vf', 'scale=512:512', // Força a imagem para 512x512 se for menor que o necessário
                '-vframes', '1', // Apenas o primeiro quadro (estático)
                '-f', 'webp', // Formato WebP
                '-c:v', 'libwebp', // Usa o codec WebP
                '-an', // Sem áudio
            ])
            .toFormat('webp') // Formato de saída WebP
            .save(outputPath)
            .on('end', () => {
                console.log('✅ [DEBUG] Figurinha estática gerada com sucesso.');
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ [DEBUG] Erro ao gerar figurinha estática:', err);
                reject(err);
            });
    });
}


/**
 * Gera uma figurinha animada a partir do vídeo.
 * @param {string} videoPath - Caminho do arquivo de entrada.
 * @param {string} outputPath - Caminho do arquivo de saída.
 */
async function createAnimatedSticker(videoPath, outputPath) {
    await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([
                '-vf', 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512', // Ajusta o tamanho e recorta a imagem
                '-r', '10', // Taxa de quadros por segundo (FPS)
                '-f', 'webp', // Formato WebP
                '-c:v', 'libwebp', // Usa o codec WebP
                '-loop', '0', // Animação em loop
                '-preset', 'default', // Preset para qualidade e compressão
                '-an', // Sem áudio
            ])
            .toFormat('webp') // Formato de saída WebP
            .save(outputPath)
            .on('end', () => {
                console.log('✅ [DEBUG] Figurinha animada gerada com sucesso.');
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ [DEBUG] Erro ao gerar figurinha animada:', err);
                reject(err);
            });
    });
}
