import fs from 'fs';
import path from 'path';

// Caminho do arquivo para armazenar os contatos que já interagiram
const interactionFilePath = path.resolve('./interactions.json');

// Função para obter os IDs de usuários ou grupos que já interagiram
const getInteractions = () => {
    if (fs.existsSync(interactionFilePath)) {
        return JSON.parse(fs.readFileSync(interactionFilePath, 'utf8'));
    }
    return [];
};

// Função para salvar um ID no arquivo de interações
const saveInteraction = (id) => {
    const interactions = getInteractions();
    if (!interactions.includes(id)) {
        interactions.push(id);
        fs.writeFileSync(interactionFilePath, JSON.stringify(interactions, null, 2));
    }
};

// Função para lidar com mensagens recebidas
export const handleWelcomeMessage = async (client, msg) => {
    try {
        const interactions = getInteractions();
        const senderId = msg.idChat; // ID do chat (grupo ou individual)

        if (!senderId) {
            console.error("❌ ID do remetente não encontrado!");
            return;
        }

        const isFirstInteraction = !interactions.includes(senderId); // Verifica se é a primeira interação

        if (isFirstInteraction) {
            const welcomeMessage = `
            👋 Olá! Seja bem-vindo(a)!

            Eu sou o bot e estou aqui para te ajudar com algumas funcionalidades. 😊

            Envie *!menu* para ver a lista de comandos disponíveis.
            `;

            // Garante que o ID esteja no formato correto
            await client.sendMessage(senderId, { text: welcomeMessage });
            saveInteraction(senderId); // Salva a interação no arquivo
            return;
        }

        // Responder ao comando !menu
        if (msg.texto.trim().toLowerCase() === '!menu') {
            const menuMessage = `
            📜 *Menu de Comandos*:

            1️⃣ *!sticker*: Envie uma imagem e eu a transformarei em figurinha para você.
            2️⃣ *!s*: Envie um gif e eu transformarei em figurinha animada.
            3️⃣ *!animado*: Envie um vídeo curto de até 10 segundos e eu transformarei em figurinha animada.
            4️⃣ *!converta*: Envie uma figurinha e marque a mesma com a frase !converta para transformá-la em imagem.

            📨 Envie um arquivo ou utilize um dos comandos acima para interagir comigo!
            `;
            await client.sendMessage(senderId, { text: menuMessage });
        }
    } catch (error) {
        console.error('❌ Erro ao processar a mensagem:', error);
    }
};
