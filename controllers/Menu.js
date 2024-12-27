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
export const handleWelcomeMessage = async (client, msg) => {
    try {
        const interactions = getInteractions();
        const senderId = msg.idChat; 
        const isGroup = senderId.endsWith('@g.us'); 
        const botName = "Zard"; 
        const adminName = "Hallyson";
        const prefix = "!"; 

        if (!senderId) {
            console.error("❌ ID do remetente não encontrado!");
            return;
        }

        const isFirstInteraction = !interactions.includes(senderId); // Verifica se é a primeira interação

        if (isFirstInteraction) {
            const welcomeMessage = `
┌──〖 *🤖 ${botName.trim()}®* 〗
│
├──👋 *Seja bem-vindo(a)!*
│
├─ Eu sou o *${botName.trim()}* e estou aqui para te ajudar com várias funcionalidades. 😊
├─ Digite *${prefix}menu* para acessar a lista de comandos disponíveis.
│
╰─❥ Desenvolvido por *${adminName.trim()}*
            `;
            await client.sendMessage(senderId, { text: welcomeMessage });
            saveInteraction(senderId); // Salva a interação no arquivo
            return;
        }

        // Responder ao comando !menu
        const comando = msg.texto.trim().toLowerCase();
        if (comando === `${prefix}menu`) {
            const menuMessage = `
┌──〖 *🔎 MENU PRINCIPAL* 〗
│
├─ Digite um dos comandos abaixo:
│
├─ *${prefix}menu geral*  📜 Comandos Gerais
├─ *${prefix}menu grupos* 👨‍👩‍👧‍👦 Comandos de Grupos
│
╰─❥ Desenvolvido por *${adminName.trim()}*
            `;
            await client.sendMessage(senderId, { text: menuMessage });
        }

        // Submenu: !menu geral
        else if (comando === `${prefix}menu geral`) {
            const geralMenu = `
┌──〖 *📜 MENU GERAL* 〗
│
├─ *${prefix}bot*  📟 Informações sobre o bot.
├─ *${prefix}s*  🖼️ Transforme fotos ou vídeos em figurinhas.
├─ *${prefix}play <nome/link>*  🎵 Baixe músicas pelo nome ou link.
│
╰─❥ Desenvolvido por *${adminName.trim()}*
            `;
            await client.sendMessage(senderId, { text: geralMenu });
        }

        // Submenu: !menu grupos
        else if (comando === `${prefix}menu grupos`) {
            if (!isGroup) {
                await client.sendMessage(senderId, {
                    text: '⚠️ Este menu é exclusivo para grupos.',
                });
                return;
            }

            const grupoMenu = `
┌──〖 *👨‍👩‍👧‍👦 MENU DE GRUPOS* 〗
│
├─ *${prefix}promover @usuario*  📈 Promove a administrador.
├─ *${prefix}rebaixar @usuario*  📉 Remove o status de administrador.
├─ *${prefix}mute @usuario <minutos>*  🔇 Silencia o usuário por tempo definido.
├─ *${prefix}desmute @usuario*  🔊 Remove o silêncio de um usuário.
├─ *${prefix}listmuted*  📜 Lista os usuários silenciados.
│
╰─❥ Apenas administradores podem usar comandos administrativos.
            `;
            await client.sendMessage(senderId, { text: grupoMenu });
        }
    } catch (error) {
        console.error('❌ Erro ao processar a mensagem:', error);
    }
};