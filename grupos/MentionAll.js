export const mentionAll = async (idChat, sock) => {
    try {
        // Obtém os metadados do grupo (incluindo a lista de membros)
        const groupMetadata = await sock.groupMetadata(idChat);
        const participants = groupMetadata.participants;  // Lista de membros

        // Cria a lista de IDs dos membros para menção
        const mentions = participants.map(participant => participant.id);

        // Gera a mensagem de boas-vindas, sem adicionar o "@" manualmente
        const message = `👋 hello? tem alguém ai ?.. @everyone!`; // A menção é feita pela API, não precisamos adicionar o "@"

        // Envia a mensagem mencionando todos os membros
        await sock.sendMessage(idChat, {
            text: message,
            mentions: mentions,  // Menciona todos os participantes
        });

    } catch (err) {
        console.error('Erro ao tentar mencionar todos os membros:', err);
    }
};
