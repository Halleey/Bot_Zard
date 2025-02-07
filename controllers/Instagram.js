import { exec } from "child_process";
import fs from "fs";
import path from "path";

// Defina as credenciais fixas
const sessionId = "";
const csrfToken = "";

export async function baixarVideoInsta(url, sock, remoteJid) {
    const output = `insta_${Date.now()}.mp4`; // Nome do arquivo de saída
    
    // Montar os cookies no formato correto
    const cookies = `sessionid=${sessionId}; csrftoken=${csrfToken};`;

    exec(`yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 --add-header "Cookie: ${cookies}" -o ${output} ${url}`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao baixar vídeo: ${error.message}`);
            await sock.sendMessage(remoteJid, { text: "🚨 Erro ao baixar o vídeo!" });
            return;
        }

        console.log(`Download concluído: ${stdout}`);

        // Enviar vídeo para o WhatsApp
        const videoBuffer = fs.readFileSync(output);
        await sock.sendMessage(remoteJid, {
            video: videoBuffer,
            caption: "🎥 Aqui está seu vídeo chefia."
        });

        // Remover arquivo após envio
        fs.unlinkSync(output);
    });
}

// Comando no bot
export async function processMessage(msg, sock) {
    const { body, remoteJid } = msg;
    
    if (body.startsWith("!vid ")) {
        const url = body.split(" ")[1]; // Pegar o link

        if (!url) {
            await sock.sendMessage(remoteJid, { text: "🚨 Envie um link válido do Instagram!" });
            return;
        }
        await sock.sendMessage(remoteJid, { text: "⏳ Baixando vídeo, aguarde..." });
        await baixarVideoInsta(url, sock, remoteJid);
    }
}
