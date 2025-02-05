import { handleMediaMessage } from './mediaHandler.js';
import { handleWelcomeMessage } from '../controllers/Menu.js';
import { stickerController } from '../controllers/StickerController.js';
import { MusicController } from '../controllers/MusicController.js';
import { GroupController } from '../grupos/GroupController.js';
import { MutedUsersController } from '../grupos/MutedUsersController.js';
import { botInfo } from '../bot/infoBot.js';
import { mentionAll } from '../grupos/MentionAll.js';
import { gerarImagemComDetalhe } from '../ia/Hercai.js';
import * as groupCommands from '../grupos/groupCommands.js'; // Importando as funções de comandos de grupo
import { incrementMessageCount, getTopUsers, displayTopUsers } from '../grupos/MessageController.js';
import {baixarVideoInsta} from '../controllers/Instagram.js'
const PREFIX = '!';

export const handleMessages = async (upsert, sock) => {
    const botId = sock.user.id;
    console.log('ID do bot:', botId);

    try {
        MutedUsersController.cleanExpiredMutes();

        const messages = upsert.messages;

        for (const msg of messages) {
            if (!msg.message) continue;

            const tipoMensagem = Object.keys(msg.message)[0];
            const textoRecebido = extractText(msg);
            const idChat = msg.key.remoteJid;
            const senderId = msg.key.participant || msg.key.remoteJid;
            const isGroup = idChat.endsWith('@g.us');

            const mensagemBaileys = {
                tipo: tipoMensagem,
                texto: textoRecebido.trim(),
                idChat,
                isGroup,
                mensagemOriginal: msg,
            };

            // Contabiliza a mensagem do usuário
            incrementMessageCount(senderId);

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
                }, 2000);
                continue;
            }

            if (!comando.startsWith(PREFIX)) {
                console.log('⚠️ [DEBUG] Mensagem ignorada (não é um comando):', comando);
                continue;
            }

            const responderTexto = async (idChat, texto, mensagemOriginal) => {
                try {
                    await sock.sendMessage(idChat, { text: texto }, { quoted: mensagemOriginal });
                } catch (error) {
                    console.error('❌ Erro ao enviar mensagem de texto:', error);
                }
            };

            const extractMentionedUser = (msg) => {
                return msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null;
            };

            if (comando.startsWith(`${PREFIX}all`)) {
                // Verifica se o remetente é um administrador
                const isSenderAdmin = await GroupController.isAdmin(idChat, senderId, sock);
                if (!isSenderAdmin) {
                    await responderTexto(idChat, '❌ Somente administradores podem usar este comando.', msg);
                    return;
                }

                // Se for administrador, execute o comando
                await mentionAll(idChat, sock);
            }

            

            if (comando.startsWith(`${PREFIX}bot`)) {
                const infoMensagem = `🤖 *${botInfo.botName}*\n` +
                                     `👑 *Dono*: ${botInfo.owner}\n` +
                                     `🛠️ *Versão*: ${botInfo.version}\n` +
                                     `📜 *Descrição*: ${botInfo.description}\n` +
                                     `🕒 *Uptime*: ${botInfo.uptime()}\n` +
                                     `🚀 *Iniciar*: ${botInfo.iniciar}`;
                await responderTexto(idChat, infoMensagem, msg);
            }

            if (comando.startsWith(`${PREFIX}gere`)) {
                const detalhes = textoRecebido.slice(6).trim();

                // Verifica se a mensagem foi enviada pelo próprio bot
                if (msg.key.fromMe === false && senderId !== botId) {
                    // Impede que qualquer outro usuário (não o bot) execute o comando
                    await responderTexto(idChat, '❌ Apenas o bot pode usar esse comando.', msg);
                    return;
                }

                if (!detalhes) {
                    await responderTexto(idChat, '❌ Por favor, forneça os detalhes da imagem a ser gerada.', msg);
                    return;
                }

                const resultadoImagem = await gerarImagemComDetalhe(detalhes, idChat, sock);
                if (resultadoImagem.erro) {
                    await responderTexto(idChat, resultadoImagem.erro, msg);
                }
            }

            if (comando.startsWith(`${PREFIX}insta`)) {
                const url = textoRecebido.split(" ")[1]; // Pegar o link do Instagram
                if (!url) {
                    await responderTexto(idChat, "🚨 Envie um link válido do Instagram!", msg);
                    return;
                }
                await responderTexto(idChat, "⏳ Baixando vídeo, aguarde...", msg);
                await baixarVideoInsta(url, sock, idChat);
            }


            // Roteamento de comandos
            if (comando === '!s' || comando === '!ss') {
                console.log(`Gerando figurinha ${comando === '!s' ? 'estática' : 'animada'}...`);
                await stickerController(sock, mensagemBaileys, { responderTexto });
            } else if (comando.startsWith(`${PREFIX}menu`)) {
                console.log('🟡 [DEBUG] Chamando handleWelcomeMessage para !menu.');
                await handleWelcomeMessage(sock, mensagemBaileys);
            } else if (comando.startsWith(`${PREFIX}play`)) {
                console.log('🟡 [DEBUG] Chamando MusicController para !play.');
                await MusicController(sock, mensagemBaileys, { responderTexto });
            }

            // Comando: !promover
            else if (comando.startsWith(`${PREFIX}promover`)) {
                const mentionedUser = extractMentionedUser(msg);
                if (!mentionedUser) {
                    await responderTexto(idChat, '⚠️ Você precisa mencionar o usuário que deseja promover.', msg);
                    return;
                }
                await groupCommands.promoteUser(idChat, senderId, mentionedUser, sock, responderTexto);
            }

            // Comando: !rebaixar
            else if (comando.startsWith(`${PREFIX}rebaixar`)) {
                const mentionedUser = extractMentionedUser(msg);
                if (!mentionedUser) {
                    await responderTexto(idChat, '⚠️ Você precisa mencionar o usuário que deseja rebaixar.', msg);
                    return;
                }
                await groupCommands.demoteUser(idChat, senderId, mentionedUser, sock, responderTexto);
            }

            // Comando: !mute
            else if (comando.startsWith(`${PREFIX}mute`)) {
                await groupCommands.muteUser(idChat, senderId, msg, comando, sock, responderTexto);
            }

            // Comando: !desmute
            else if (comando.startsWith(`${PREFIX}desmute`)) {
                const mentionedUser = extractMentionedUser(msg);
                if (!mentionedUser) {
                    await responderTexto(idChat, '⚠️ Você precisa mencionar o usuário que deseja desmutar.', msg);
                    continue;
                }
                // Passando a função responderTexto corretamente
                await groupCommands.unmuteUser(idChat, senderId, mentionedUser, sock, responderTexto);
            }

            // Comando: !ranking
            else if (comando.startsWith(`${PREFIX}ranking`)) {
                console.log('🔝 Exibindo ranking de usuários mais ativos...');
                await displayTopUsers(sock, idChat);
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