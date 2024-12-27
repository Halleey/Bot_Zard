import { handleMediaMessage } from './mediaHandler.js';
import { handleWelcomeMessage } from '../controllers/Menu.js';
import { stickerController } from '../controllers/StickerController.js';
import { MusicController } from '../controllers/MusicController.js';
import { GroupController } from '../grupos/GroupController.js';
import { MutedUsersController } from '../grupos/MutedUsersController.js';
import {botInfo} from '../bot/infoBot.js'
const PREFIX = '!';

export const handleMessages = async (upsert, sock) => {
    try {
        // Limpa usuários com silêncios expirados antes de processar as mensagens
        MutedUsersController.cleanExpiredMutes();

        const messages = upsert.messages;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const tipoMensagem = Object.keys(msg.message)[0];
            const textoRecebido = extractText(msg);
            const idChat = msg.key.remoteJid;
            const senderId = msg.key.participant || msg.key.remoteJid; // Usuário que enviou a mensagem
            const isGroup = idChat.endsWith('@g.us');

            const mensagemBaileys = {
                tipo: tipoMensagem,
                texto: textoRecebido.trim(),
                idChat,
                isGroup,
                mensagemOriginal: msg,
            };

            console.log('📩 Mensagem recebida:', mensagemBaileys);

            const comando = textoRecebido.trim().toLowerCase();

            if (MutedUsersController.isMuted(idChat, senderId)) {
                console.log(`🛑 Mensagem de usuário silenciado (${senderId}) será excluída após 2 segundos.`);
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(idChat, { delete: msg.key });
                    } catch (error) {
                        console.error('❌ Erro ao apagar mensagem:', error);
                    }
                }, 2000); // Atraso de 2 segundos
                continue;
            }
            

            // Verifique se a mensagem é um comando
            if (!comando.startsWith(PREFIX)) {
                console.log('⚠️ [DEBUG] Mensagem ignorada (não é um comando):', comando);
                continue;
            }

            // Função para enviar respostas
            const responderTexto = async (idChat, texto, mensagemOriginal) => {
                try {
                    await sock.sendMessage(idChat, { text: texto }, { quoted: mensagemOriginal });
                } catch (error) {
                    console.error('❌ Erro ao enviar mensagem de texto:', error);
                }
            };

            // Função para extrair usuário mencionado
            const extractMentionedUser = (msg) => {
                return msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
            };

            if (comando.startsWith(`${PREFIX}bot`)) {
                const infoMensagem = `🤖 *${botInfo.botName}*\n` +
                                     `👑 *Dono*: ${botInfo.owner}\n` +
                                     `🛠️ *Versão*: ${botInfo.version}\n` +
                                     `📜 *Descrição*: ${botInfo.description}\n` +
                                     `🕒 *Uptime*: ${botInfo.uptime()}\n` +
                                     `🚀 *Iniciar*: ${botInfo.iniciar}`;
                await responderTexto(idChat, infoMensagem, msg);
            }

            // Roteamento de comandos
            if (comando.startsWith(`${PREFIX}s`)) {
                console.log('🟡 [DEBUG] Chamando stickerController para comando explícito.');
                await stickerController(sock, mensagemBaileys, { responderTexto });
            } 
            
            else if (comando.startsWith(`${PREFIX}menu`)) {
                console.log('🟡 [DEBUG] Chamando handleWelcomeMessage para !menu.');
                await handleWelcomeMessage(sock, mensagemBaileys);
            } 
            
            else if (comando.startsWith(`${PREFIX}play`)) {
                console.log('🟡 [DEBUG] Chamando MusicController para !play.');
                await MusicController(sock, mensagemBaileys, { responderTexto });
            }

            // Comando: !promover
            else if (comando.startsWith(`${PREFIX}promover`)) {
                if (!isGroup) {
                    await responderTexto(idChat, '⚠️ Este comando só pode ser usado em grupos.', msg);
                    return;
                }
            
                const mentionedUser = extractMentionedUser(msg);
                if (!mentionedUser) {
                    await responderTexto(idChat, '⚠️ Você precisa mencionar o usuário que deseja promover.', msg);
                    return;
                }
            
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
            }
            else if (comando.startsWith(`${PREFIX}rebaixar`)) {
                if (!isGroup) {
                    await responderTexto(idChat, '⚠️ Este comando só pode ser usado em grupos.', msg);
                    return;
                }
            
                const mentionedUser = extractMentionedUser(msg);
                if (!mentionedUser) {
                    await responderTexto(idChat, '⚠️ Você precisa mencionar o usuário que deseja rebaixar.', msg);
                    return;
                }
            
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
            }

            // Comando: !mute
            else if (comando.startsWith(`${PREFIX}mute`)) {
                if (!isGroup) {
                    await responderTexto(idChat, '⚠️ Este comando só pode ser usado em grupos.', msg);
                    continue;
                }

                const mentionedUser = extractMentionedUser(msg);
                const durationMatch = comando.match(/\d+/);
                const duration = durationMatch ? parseInt(durationMatch[0], 10) : 0;

                if (!mentionedUser || duration <= 0) {
                    await responderTexto(idChat, '⚠️ Use o comando no formato: !mute @usuario <minutos>', msg);
                    continue;
                }

                const isSenderAdmin = await GroupController.isAdmin(idChat, senderId, sock);
                if (!isSenderAdmin) {
                    await responderTexto(idChat, '❌ Apenas administradores podem usar este comando.', msg);
                    continue;
                }

                MutedUsersController.addMutedUser(idChat, mentionedUser, duration);
                await responderTexto(
                    idChat,
                    `✅ O usuário @${mentionedUser.split('@')[0]} foi silenciado por ${duration} minutos.`,
                    msg
                );
            }

            // Comando: !desmute
            else if (comando.startsWith(`${PREFIX}desmute`)) {
                if (!isGroup) {
                    await responderTexto(idChat, '⚠️ Este comando só pode ser usado em grupos.', msg);
                    continue;
                }

                const mentionedUser = extractMentionedUser(msg);
                if (!mentionedUser) {
                    await responderTexto(idChat, '⚠️ Você precisa mencionar o usuário que deseja desmutar.', msg);
                    continue;
                }

                const isSenderAdmin = await GroupController.isAdmin(idChat, senderId, sock);
                if (!isSenderAdmin) {
                    await responderTexto(idChat, '❌ Apenas administradores podem usar este comando.', msg);
                    continue;
                }

                const wasMuted = MutedUsersController.removeMutedUser(idChat, mentionedUser);
                if (wasMuted) {
                    await responderTexto(idChat, `✅ O usuário @${mentionedUser.split('@')[0]} foi desmutado.`, msg);
                } else {
                    await responderTexto(idChat, `⚠️ O usuário @${mentionedUser.split('@')[0]} não está silenciado.`, msg);
                }
            }

            // Comando: !listmuted
            else if (comando === `${PREFIX}listmuted`) {
                const mutedUsers = MutedUsersController.listMutedUsers(idChat);
                if (!Object.keys(mutedUsers).length) {
                    await responderTexto(idChat, '📜 Nenhum usuário está silenciado no momento.', msg);
                } else {
                    const list = Object.entries(mutedUsers)
                        .map(([userId, muteUntil]) => {
                            const remainingTime = Math.ceil((muteUntil - Date.now()) / 60000);
                            return `@${userId.split('@')[0]} - ${remainingTime} minutos restantes`;
                        })
                        .join('\n');
                    await responderTexto(idChat, `📜 Usuários silenciados:\n${list}`, msg);
                }
            }

            // Mensagens de mídia
            else if (['imageMessage', 'videoMessage'].includes(tipoMensagem)) {
                await handleMediaMessage(msg, sock, mensagemBaileys);
            }

            // Ignorar comandos desconhecidos
            else {
                console.log('⚠️ [DEBUG] Comando desconhecido:', comando);
                // Não enviar nenhuma resposta ao usuário
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar mensagens:', error);
    }
};

const extractText = (msg) => {
    return (
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        ''
    );
};