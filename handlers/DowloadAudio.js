import ytdl from 'ytdl-core';
import fs from 'fs';
import { search } from 'yt-search';
import path from 'path';

const downloadFolder = './downloads/';
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

export const downloadAndSendAudio = async (sock, chatId, searchTerm, msg) => {
    try {
        const searchResults = await search(searchTerm);
        if (!searchResults.videos.length) {
            await sock.sendMessage(chatId, { text: '❌ Nenhum resultado encontrado no YouTube.' }, { quoted: msg });
            return;
        }

        const video = searchResults.videos[0];
        const audioStream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
        const filePath = path.join(downloadFolder, `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`);
        
        const writeStream = fs.createWriteStream(filePath);
        audioStream.pipe(writeStream);

        writeStream.on('finish', async () => {
            await sock.sendMessage(chatId, { audio: { url: filePath }, mimetype: 'audio/mp4' }, { quoted: msg });
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        console.error('❌ Erro ao baixar o áudio:', error);
        await sock.sendMessage(chatId, { text: '❌ Ocorreu um erro ao baixar o áudio.' }, { quoted: msg });
    }
};
