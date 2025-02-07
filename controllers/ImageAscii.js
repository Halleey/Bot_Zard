import figlet from 'figlet';

// Função para gerar ASCII Art usando figlet
const gerarAsciiArt = (texto) => {
    return new Promise((resolve, reject) => {
        figlet(texto, (err, data) => {
            if (err) {
                console.error('Erro ao gerar ASCII Art:', err);
                resolve('❌ Ocorreu um erro ao gerar a arte ASCII.');
            } else {
                resolve(data);
            }
        });
    });
};

// Função para extrair texto da mensagem
const extractText = (msg) => {
    return msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '';
};

export const handleAsciiArt = async (msg, sock) => {
    const textoRecebido = extractText(msg).trim();

    if (!textoRecebido.startsWith('!asc ')) return;

    const texto = textoRecebido.replace('!asc ', '').trim();
    if (!texto) {
        await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Digite um texto após o comando. Exemplo: !asc Hello' });
        return;
    }

    const asciiArt = await gerarAsciiArt(texto);
    await sock.sendMessage(msg.key.remoteJid, { text: `\`\`\`${asciiArt}\`\`\`` });
};

    
