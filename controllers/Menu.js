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
        const isGroup = senderId.endsWith('@g.us'); // Verifica se é um grupo

        if (!senderId) {
            console.error("❌ ID do remetente não encontrado!");
            return;
        }

        const isFirstInteraction = !interactions.includes(senderId); // Verifica se é a primeira interação

        if (isFirstInteraction) {
            const welcomeMessage = `
            👋 Olá! Seja bem-vindo(a)!

            Eu sou o bot e estou aqui para te ajudar com várias funcionalidades. 😊

            Envie *!menu* para ver a lista de comandos disponíveis.
            `;
            await client.sendMessage(senderId, { text: welcomeMessage });
            saveInteraction(senderId); // Salva a interação no arquivo
            return;
        }

        // Responder ao comando !menu
        const comando = msg.texto.trim().toLowerCase();
        if (comando === '!menu') {
            const menuMessage = `
            📜 *Menu Principal*:

            1️⃣ *!menu geral*: Comandos disponíveis para todos os usuários.
            2️⃣ *!menu grupos*: Comandos exclusivos para grupos.

            📨 Digite um dos comandos acima para acessar o menu desejado.
            `;
            await client.sendMessage(senderId, { text: menuMessage });
        }

        // Submenu: !menu geral
        else if (comando === '!menu geral') {
            const geralMenu = `
            📜 *Menu Geral*:

            1️⃣ *!bot*: Exibe informações sobre o bot (dono, versão, uptime, etc.).
            2️⃣ *!s*: Envie uma foto ou vídeo para transformá-los em figurinhas (vídeos de até 6 segundos).
            3️⃣ *!play*: Baixa músicas pelo nome ou link (Exemplo: !play <nome_da_música> ou *link*).

            📨 Utilize um dos comandos acima para interagir comigo!
            `;
            await client.sendMessage(senderId, { text: geralMenu });
        }

        // Submenu: !menu grupos
        else if (comando === '!menu grupos') {
            if (!isGroup) {
                await client.sendMessage(senderId, {
                    text: '⚠️ Este menu é exclusivo para grupos.',
                });
                return;
            }

            const grupoMenu = `
            📜 *Menu de Grupos*:

            1️⃣ *!promover @usuario*: Promove o usuário mencionado a administrador.
            2️⃣ *!rebaixar @usuario*: Remove o status de administrador do usuário mencionado.
            3️⃣ *!mute @usuario <minutos>*: Silencia o usuário mencionado por um tempo especificado.
            4️⃣ *!desmute @usuario*: Remove o silêncio de usuários.
            5️⃣ *!listmuted*: Lista os usuários silenciados no grupo atual.

            ⚠️ Apenas administradores podem usar comandos administrativos.
            `;
            await client.sendMessage(senderId, { text: grupoMenu });
        }
    } catch (error) {
        console.error('❌ Erro ao processar a mensagem:', error);
    }
};
