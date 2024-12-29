import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GroupController } from './Members.js'; // Supondo que você tenha um controller para obter participantes do grupo

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, 'messageCounts.json');

// Função para carregar os dados de contagem de mensagens do arquivo JSON
export const loadMessageCounts = () => {
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } else {
        return {}; // Retorna um objeto vazio caso o arquivo não exista
    }
};

// Função para salvar os dados de contagem de mensagens no arquivo JSON
export const saveMessageCounts = (data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Função para incrementar a contagem de mensagens de um usuário
export const incrementMessageCount = (userId) => {
    const counts = loadMessageCounts();

    // Incrementa a contagem do usuário
    if (!counts[userId]) {
        counts[userId] = 0;
    }
    counts[userId]++;

    // Salva os dados atualizados no arquivo
    saveMessageCounts(counts);
};

// Função para retornar a lista de usuários com mais mensagens (ordem decrescente)
export const getTopUsers = () => {
    const counts = loadMessageCounts();

    // Ordena os usuários por número de mensagens em ordem decrescente
    const sortedUsers = Object.entries(counts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([userId, count]) => ({ userId, count }));

    return sortedUsers;
};

// Função para exibir os usuários mais ativos (somente membros do grupo)
export const displayTopUsers = async (sock, idChat) => {
    const topUsers = getTopUsers();

    // Obtém a lista de participantes do grupo
    const groupMembers = await GroupController.getGroupMembers(idChat, sock);

    if (topUsers.length === 0) {
        await sock.sendMessage(idChat, { text: 'Não há usuários suficientes para mostrar um ranking de mensagens.' });
        return;
    }

    // Filtra os usuários que são membros do grupo
    const membersInRanking = topUsers.filter(user => groupMembers.includes(user.userId));

    if (membersInRanking.length === 0) {
        await sock.sendMessage(idChat, { text: 'Nenhum membro do grupo enviou mensagens suficientes para aparecer no ranking.' });
        return;
    }

    // Cria a mensagem do ranking com os 5 usuários mais ativos
    let topUsersMessage = '🏆 *Ranking dos usuários mais ativos:*\n';
    membersInRanking.slice(0, 5).forEach((user, index) => {
        topUsersMessage += `\n${index + 1}. @${user.userId} - ${user.count} mensagens`;
    });

    // Envia a mensagem mencionando os usuários
    await sock.sendMessage(idChat, {
        text: topUsersMessage,
        mentions: membersInRanking.slice(0, 5).map(user => user.userId)
    });
};

// Função para contar e salvar cada mensagem enviada
export const handleMessage = async (msg, sock) => {
    const userId = msg.key.participant || msg.key.remoteJid;

    // Incrementa a contagem de mensagens do usuário
    incrementMessageCount(userId);

    // Lógica para detectar o comando de ranking
    const comando = msg.message.conversation.trim().toLowerCase();
    if (comando === '!ranking') {
        // Exibe os top usuários no chat
        await displayTopUsers(sock, msg.key.remoteJid);
    }
};
