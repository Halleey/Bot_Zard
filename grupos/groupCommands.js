import { GroupController } from '../grupos/GroupController.js';
import { MutedUsersController } from '../grupos/MutedUsersController.js';

export const promoteUser = async (idChat, senderId, mentionedUser, sock, responderTexto) => {
    const isSenderAdmin = await GroupController.isAdmin(idChat, senderId, sock);
    if (!isSenderAdmin) {
        await responderTexto(idChat, '❌ Apenas administradores podem usar este comando.', msg);
        return;
    }

    await GroupController.promoteParticipant(idChat, mentionedUser, sock);
    await sock.sendMessage(idChat, {
        text: `✅ O usuário @${mentionedUser.split('@')[0]} foi promovido a administrador.`,
        mentions: [mentionedUser],
    });
};

export const demoteUser = async (idChat, senderId, mentionedUser, sock, responderTexto) => {
    const isSenderAdmin = await GroupController.isAdmin(idChat, senderId, sock);
    if (!isSenderAdmin) {
        await responderTexto(idChat, '❌ Apenas administradores podem usar este comando.', msg);
        return;
    }

    await GroupController.demoteParticipant(idChat, mentionedUser, sock);
    await sock.sendMessage(idChat, {
        text: `✅ O usuário @${mentionedUser.split('@')[0]} foi rebaixado de administrador.`,
        mentions: [mentionedUser],
    });
};

export const muteUser = async (idChat, senderId, msg, comando, sock, responderTexto) => {
    if (!msg.message.extendedTextMessage?.contextInfo?.mentionedJid || !comando.match(/\d+$/)) {
        await responderTexto(idChat, '⚠️ Use o comando no formato: !mute @usuario <minutos>. O tempo deve estar entre 1 e 1440 minutos.', msg);
        return;
    }

    const mentionedUsers = msg.message.extendedTextMessage.contextInfo.mentionedJid;
    const durationMatch = comando.match(/\d+$/);
    const duration = parseInt(durationMatch[0], 10);

    if (duration <= 0 || duration > 1440) {
        await responderTexto(idChat, '⚠️ O tempo deve estar entre 1 e 1440 minutos.', msg);
        return;
    }

    const mentionedUser = mentionedUsers[0];
    const isSenderAdmin = await GroupController.isAdmin(idChat, senderId, sock);
    if (!isSenderAdmin) {
        await responderTexto(idChat, '❌ Apenas administradores podem usar este comando.', msg);
        return;
    }

    MutedUsersController.addMutedUser(idChat, mentionedUser, duration);
    await responderTexto(idChat, `✅ O usuário @${mentionedUser.split('@')[0]} foi silenciado por ${duration} minuto(s).`, msg);
};
// Exemplo de função unmuteUser no groupCommands.js
export const unmuteUser = async (idChat, senderId, mentionedUser, sock, responderTexto) => {
    try {
        // Verifica se o remetente tem permissão
        const isSenderAdmin = await GroupController.isAdmin(idChat, senderId, sock);
        if (!isSenderAdmin) {
            await responderTexto(idChat, '❌ Somente administradores podem realizar essa ação.', null);
            return;
        }

        // Remove o usuário da lista de silenciados
        const desmutado = await MutedUsersController.removeMutedUser(idChat, mentionedUser);

        if (desmutado) {
            // Mensagem de confirmação
            await responderTexto(idChat, `✅ O usuário @${mentionedUser.split('@')[0]} foi desmutado no grupo ${idChat}.`, null);
        } else {
            await responderTexto(idChat, '⚠️ Não foi possível desmutar o usuário. Talvez ele não esteja silenciado.', null);
        }
    } catch (err) {
        console.error('Erro ao desmutar o usuário:', err);
        await responderTexto(idChat, '❌ Ocorreu um erro ao tentar desmutar o usuário. Por favor, tente novamente mais tarde.', null);
    }
};
