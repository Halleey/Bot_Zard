export const GroupController = {
    // Verificar se um usuário é administrador do grupo
    isAdmin: async (groupId, userId, sock) => {
        try {
            // Obtém os metadados do grupo
            const groupMetadata = await sock.groupMetadata(groupId);

            // Filtra os administradores do grupo
            const admins = groupMetadata.participants
                .filter((participant) => participant.admin === 'admin' || participant.admin === 'superadmin')
                .map((participant) => participant.id);

            return admins.includes(userId);
        } catch (error) {
            console.error('Erro ao verificar administradores:', error.message);
            return false;
        }
    },

    // Promover um participante a administrador
    promoteParticipant: async (groupId, userId, sock) => {
        try {
            await sock.groupParticipantsUpdate(groupId, [userId], 'promote');
            console.log(`Usuário ${userId} promovido a administrador no grupo ${groupId}`);
        } catch (error) {
            console.error('Erro ao promover participante:', error.message);
        }
    },

    // Rebaixar um participante de administrador para membro comum
    demoteParticipant: async (groupId, userId, sock) => {
        try {
            await sock.groupParticipantsUpdate(groupId, [userId], 'demote');
            console.log(`Usuário ${userId} rebaixado a membro comum no grupo ${groupId}`);
        } catch (error) {
            console.error('Erro ao rebaixar participante:', error.message);
        }
    }
};
