import ytSearch from 'yt-search';
import { unlink } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const MusicController = async (sock, mensagemBaileys, options) => {
    const { responderTexto } = options;
    const idChat = mensagemBaileys.idChat;
    const texto = (mensagemBaileys.texto || '').replace('!play', '').trim();

    if (!texto) {
        await responderTexto(idChat, 'Por favor, forneça o nome ou URL da música.', mensagemBaileys.mensagemOriginal);
        return;
    }

    const downloadsDir = path.resolve('./downloads');
    const mp3Path = path.join(downloadsDir, `audio_${Date.now()}.mp3`);

    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }

    try {
        console.log(`🎵 Buscando música: ${texto}`);
        await responderTexto(idChat, `Buscando música: *${texto}*`, mensagemBaileys.mensagemOriginal);

        // Buscar no YouTube
        const resultados = await ytSearch(texto);
        const video = resultados.videos.length > 0 ? resultados.videos[0] : null;

        if (!video) {
            await responderTexto(idChat, 'Não consegui encontrar a música. Tente um nome ou URL válido.', mensagemBaileys.mensagemOriginal);
            return;
        }

        const { title, url } = video;
        console.log(`🎵 Música encontrada: ${title} (${url})`);
        await responderTexto(idChat, `Baixando: *${title}*`, mensagemBaileys.mensagemOriginal);

        // Baixar áudio em formato MP3 usando yt-dlp
        const ytDlpPath = 'yt-dlp'; // Certifique-se de que yt-dlp está instalado e configurado no PATH
        await execAsync(`${ytDlpPath} --extract-audio --audio-format mp3 -o "${mp3Path}" "${url}"`);
        console.log(`✅ Áudio baixado com sucesso: ${mp3Path}`);

        if (!fs.existsSync(mp3Path)) {
            throw new Error('Arquivo MP3 não encontrado após download.');
        }

        // Enviar o áudio para o cliente
        console.log('🎵 Enviando áudio...');
        const audioBuffer = fs.readFileSync(mp3Path);
        await sock.sendMessage(
            idChat,
            { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: true }, // ptt: true para mensagem de voz
            { quoted: mensagemBaileys.mensagemOriginal }
        );
        console.log('✅ Áudio enviado com sucesso!');
    } catch (error) {
        console.error('❌ Erro no MusicController:', error);
        await responderTexto(idChat, 'Houve um erro ao processar a música. Tente novamente.', mensagemBaileys.mensagemOriginal);
    } finally {
        // Limpar arquivos temporários
        if (fs.existsSync(mp3Path)) {
            try {
                await unlink(mp3Path);
                console.log(`🟡 Arquivo temporário excluído: ${mp3Path}`);
            } catch (err) {
                console.error('❌ Erro ao excluir arquivo temporário:', err);
            }
        }
    }
};
