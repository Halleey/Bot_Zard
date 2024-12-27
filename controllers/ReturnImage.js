import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { fileURLToPath } from 'url'; // Necessário para __dirname em ES Modules

const ffmpegPath = 'C:/Users/apare/Downloads/ffmpeg/bin/ffmpeg.exe';
ffmpeg.setFfmpegPath(ffmpegPath);

// Define o caminho de downloads
const downloadDir = path.resolve('C:/Users/apare/Desktop/new_bot/downloads');

export const handleStickerToMedia = async (client, msg) => {
    try {
        // Verifica se a mensagem é válida e contém uma figurinha
        if (!msg.hasQuotedMsg || msg.body.trim() !== '!converta') {
            return;
        }

        const quotedMsg = await msg.getQuotedMessage();

        if (!quotedMsg.hasMedia || quotedMsg.type !== 'sticker') {
            await client.sendMessage(msg.from, 'Por favor, responda a uma figurinha com o comando "!converta".');
            return;
        }

        console.log('[DEBUG] Figurinha recebida, iniciando download...');
        const media = await quotedMsg.downloadMedia();

        if (!media || !media.data) {
            console.error('[ERROR] Figurinha não foi baixada corretamente:', media);
            await client.sendMessage(msg.from, 'Não foi possível baixar a figurinha. Tente novamente.');
            return;
        }

        console.log('[DEBUG] Figurinha baixada com sucesso.');
        const buffer = Buffer.from(media.data, 'base64');
        const tempStickerPath = path.resolve(downloadDir, 'temp_sticker.webp');
        const imageOutputPath = path.resolve(downloadDir, 'output_media.png');

        // Salvar a figurinha temporariamente
        fs.writeFileSync(tempStickerPath, buffer);
        console.log(`[DEBUG] Figurinha salva temporariamente em: ${tempStickerPath}`);

        // Converter figurinha estática para imagem PNG
        console.log('[DEBUG] Convertendo figurinha estática para imagem...');
        await new Promise((resolve, reject) => {
            ffmpeg(tempStickerPath)
                .output(imageOutputPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        console.log('[DEBUG] Conversão para imagem concluída. Enviando...');
        const imageMedia = fs.readFileSync(imageOutputPath); // Lê a imagem como buffer
        await client.sendMessage(msg.from, { image: imageMedia }); // Envia a imagem

    } catch (error) {
        console.error('[ERROR] Erro ao processar a figurinha:', error);
        await client.sendMessage(msg.from, 'Ocorreu um erro ao converter a figurinha. Tente novamente.');
    } finally {
        // Limpeza dos arquivos temporários após o envio
        try {
            const tempStickerPath = path.resolve(downloadDir, 'temp_sticker.webp');
            const imageOutputPath = path.resolve(downloadDir, 'output_media.png');

            if (fs.existsSync(tempStickerPath)) {
                fs.unlinkSync(tempStickerPath);
                console.log('[DEBUG] Arquivo temporário de figurinha removido.');
            }

            if (fs.existsSync(imageOutputPath)) {
                fs.unlinkSync(imageOutputPath);
                console.log('[DEBUG] Arquivo de imagem temporário removido.');
            }
        } catch (cleanupError) {
            console.error('[ERROR] Erro ao limpar arquivos temporários:', cleanupError);
        }
    }
};
