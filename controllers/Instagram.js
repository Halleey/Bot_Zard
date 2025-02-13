import { exec } from "child_process";
import fs from "fs";
import path from "path";

const sessionId = "";
const csrfToken = "";

/**
 * Baixa um vídeo do Instagram e envia pelo WhatsApp.
 * @param {string} url - URL do vídeo do Instagram.
 * @param {object} sock - Objeto do bot WhatsApp (Baileys).
 * @param {string} remoteJid -
 */
export async function baixarVideoInsta(url, sock, remoteJid) {
    const outputFile = `insta_${Date.now()}.mp4`; // Nome do arquivo temporário
    const outputPath = path.resolve(outputFile); // Caminho absoluto
    const finalOutput = `converted_${Date.now()}.mp4`; // Arquivo convertido


    const cookies = `sessionid=${sessionId}; csrftoken=${csrfToken};`;


    exec("yt-dlp --version", (err) => {
        if (err) {
            sock.sendMessage(remoteJid, { text: "🚨 Erro: yt-dlp não está instalado no servidor!" });
            return;
        }

      
        exec(`yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 --add-header "Cookie: ${cookies}" -o "${outputPath}" "${url}"`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Erro ao baixar vídeo: ${stderr}`);
                await sock.sendMessage(remoteJid, { text: "🚨 Erro ao baixar o vídeo!" });
                return;
            }

            console.log(`Download concluído: ${stdout}`);

            // Converter o vídeo para um formato compatível com o WhatsApp
            exec(`ffmpeg -i "${outputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k "${finalOutput}"`, async (convertError) => {
                if (convertError) {
                    console.error(`Erro na conversão do vídeo: ${convertError.message}`);
                    await sock.sendMessage(remoteJid, { text: "🚨 Erro ao converter o vídeo!" });
                    return;
                }

                const videoBuffer = fs.readFileSync(finalOutput);

                await sock.sendMessage(remoteJid, {
                    video: videoBuffer,
                    caption: "📹 Aqui está seu vídeo!"
                });

                fs.unlinkSync(outputPath);
                fs.unlinkSync(finalOutput);
            });
        });
    });
}

/**
 * Processa mensagens recebidas no bot e executa comandos.
 * @param {object} msg - Mensagem recebida.
 * @param {object} sock - Objeto do bot WhatsApp (Baileys).
 */
export async function processMessage(msg, sock) {
    const { body, remoteJid } = msg;

    if (body.startsWith("!vid ")) {
        const url = body.split(" ")[1]; // Pega a URL do vídeo

        if (!url) {
            await sock.sendMessage(remoteJid, { text: "🚨 Envie um link válido do Instagram!" });
            return;
        }

        await sock.sendMessage(remoteJid, { text: "⏳ Baixando vídeo, aguarde..." });
        await baixarVideoInsta(url, sock, remoteJid);
    }
}
