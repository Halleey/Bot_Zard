import fs from 'fs';
import path from 'path';

// Caminho do arquivo que armazena os usuários silenciados
const mutedFilePath = path.resolve('./mutedUsers.json');

// Função para carregar usuários silenciados do arquivo
const loadMutedUsers = () => {
    if (fs.existsSync(mutedFilePath)) {
        return JSON.parse(fs.readFileSync(mutedFilePath, 'utf8'));
    }
    return {};
};

// Função para salvar usuários silenciados no arquivo
const saveMutedUsers = (mutedUsers) => {
    fs.writeFileSync(mutedFilePath, JSON.stringify(mutedUsers, null, 2));
};

export const MutedUsersController = {
    // Adicionar um usuário à lista de silenciados
    addMutedUser: (groupId, userId, durationInMinutes) => {
        const mutedUsers = loadMutedUsers();
        const muteUntil = Date.now() + durationInMinutes * 60 * 1000;
    
        if (!mutedUsers[groupId]) {
            mutedUsers[groupId] = {};
        }
    
        mutedUsers[groupId][userId] = muteUntil;
    
        saveMutedUsers(mutedUsers);
        console.log(
            `✅ O usuário @${userId.split('@')[0]} foi silenciado no grupo ${groupId} por ${durationInMinutes} minuto(s) (até ${new Date(muteUntil).toLocaleString()}).`
        );
    },
    

    // Verificar se um usuário está silenciado
    isMuted: (groupId, userId) => {
        const mutedUsers = loadMutedUsers();
        const groupMutedUsers = mutedUsers[groupId];
        const now = Date.now();

        if (groupMutedUsers && groupMutedUsers[userId]) {
            if (groupMutedUsers[userId] > now) {
                const remainingTime = Math.ceil((groupMutedUsers[userId] - now) / 60000); // Minutos restantes
                console.log(
                    `⏳ O usuário ${userId} está silenciado no grupo ${groupId} por mais ${remainingTime} minutos.`
                );
                return true;
            } else {
                console.log(`⏳ O silêncio do usuário ${userId} no grupo ${groupId} expirou. Removendo...`);
                delete groupMutedUsers[userId];
                saveMutedUsers(mutedUsers);
            }
        }
        return false;
    },

    // Remover um usuário específico da lista de silenciados
    removeMutedUser: (groupId, userId) => {
        const mutedUsers = loadMutedUsers();

        if (mutedUsers[groupId] && mutedUsers[groupId][userId]) {
            delete mutedUsers[groupId][userId];
            if (Object.keys(mutedUsers[groupId]).length === 0) {
                delete mutedUsers[groupId];
            }
            saveMutedUsers(mutedUsers);
            console.log(`✅ O usuário ${userId} foi desmutado no grupo ${groupId}.`);
            return true;
        }

        console.log(`⚠️ O usuário ${userId} não foi encontrado na lista de silenciados do grupo ${groupId}.`);
        return false;
    },

    // Remover todos os usuários silenciados expirados
    cleanExpiredMutes: () => {
        const mutedUsers = loadMutedUsers();
        const now = Date.now();

        Object.keys(mutedUsers).forEach((groupId) => {
            const groupMutedUsers = mutedUsers[groupId];
            Object.keys(groupMutedUsers).forEach((userId) => {
                if (groupMutedUsers[userId] <= now) {
                    console.log(`⏳ Removendo silêncio expirado do usuário ${userId} no grupo ${groupId}.`);
                    delete groupMutedUsers[userId];
                }
            });
            if (Object.keys(groupMutedUsers).length === 0) {
                console.log(`🧹 Removendo o grupo ${groupId} da lista de silenciados (nenhum usuário restante).`);
                delete mutedUsers[groupId];
            }
        });

        saveMutedUsers(mutedUsers);
    },

    // Listar todos os usuários silenciados de um grupo com o tempo restante
    listMutedUsers: (groupId) => {
        const mutedUsers = loadMutedUsers();
        const now = Date.now();
    
        if (mutedUsers[groupId]) {
            const mutedList = Object.entries(mutedUsers[groupId])
                .map(([userId, muteUntil]) => {
                    const remainingTime = muteUntil - now;
    
                    if (remainingTime > 0) {
                        const remainingMinutes = Math.ceil(remainingTime / 60000);
                        return `- @${userId.split('@')[0]}: silenciado por mais ${remainingMinutes} minuto(s).`;
                    } else {
                        // Remove usuário da lista se o tempo já expirou
                        delete mutedUsers[groupId][userId];
                        return null;
                    }
                })
                .filter(Boolean);
    
            saveMutedUsers(mutedUsers); // Atualiza lista sem usuários expirados
    
            return mutedList.length > 0 ? mutedList.join('\n') : '⚠️ Nenhum usuário está silenciado neste grupo.';
        }
    
        return '⚠️ Nenhum usuário está silenciado neste grupo.';
    },
    
}    