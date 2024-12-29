export const GroupController = {
    // Função para obter os membros do grupo
    getGroupMembers: async (idChat, sock) => {
        try {
            const groupMetadata = await sock.groupMetadata(idChat);  // Obtém os metadados do grupo
            return groupMetadata.participants.map(member => member.id);  // Retorna uma lista de userIds
        } catch (error) {
            console.error('Erro ao obter membros do grupo:', error);
            return [];
        }
    }
};
