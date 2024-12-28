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
        if (durationInMinutes <= 0 || durationInMinutes > 1440) { // Limite: 1 minuto a 24 horas
            console.error('⚠️ O tempo de silêncio deve estar entre 1 e 1440 minutos.');
            return false;
        }
    
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
        return true;
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
            console.log(`✅ O usuário @${userId.split('@')[0]} foi desmutado no grupo ${groupId}.`);
            return true;
        }
    
        console.log(`⚠️ O usuário @${userId.split('@')[0]} não foi encontrado na lista de silenciados do grupo ${groupId}.`);
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
            // Filtra e formata a lista de usuários silenciados
            const mutedList = Object.entries(mutedUsers[groupId])
                .filter(([userId, muteUntil]) => {
                    const remainingTime = muteUntil - now;
                    if (remainingTime > 0) {
                        return true; // Mantém o usuário na lista se ainda está silenciado
                    } else {
                        // Remove usuários cujo tempo expirou
                        delete mutedUsers[groupId][userId];
                        return false;
                    }
                })
                .map(([userId, muteUntil]) => {
                    const remainingMinutes = Math.ceil((muteUntil - now) / 60000);
                    return `- @${userId.split('@')[0]}: silenciado por mais ${remainingMinutes} minuto(s).`;
                });
    
            // Salva a lista atualizada sem os usuários expirados
            saveMutedUsers(mutedUsers);
    
            return mutedList; // Retorna a lista de usuários silenciados como array
        }
    
        // Caso não haja usuários silenciados no grupo, retorna um array vazio
        return [];
    },
}    