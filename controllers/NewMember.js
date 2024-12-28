const recentlyWelcomed = new Set();

export const handleGroupParticipantsUpdate = async (update, sock) => {
    try {
        const idChat = update.id; // ID do grupo
        const participants = update.participants; // Participantes que entraram ou saíram
        const action = update.action; // Ação: 'add' (entrada) ou 'remove' (saída)

        for (const participant of participants) {
            if (action === 'add') {
                // Verifica se o participante já foi bem-vindo recentemente
                if (recentlyWelcomed.has(participant)) {
                    console.log(`🔄 Ignorando mensagem duplicada de boas-vindas para ${participant}`);
                    continue;
                }

                // Adiciona ao cache e limpa após 5 segundos
                recentlyWelcomed.add(participant);
                setTimeout(() => recentlyWelcomed.delete(participant), 5000);

                // Mensagem de boas-vindas
                const welcomeMessage = `🎉 Bem-vindo(a) @${participant.split('@')[0]} ao grupo! Esperamos que você se divirta.`;
                await sock.sendMessage(idChat, {
                    text: welcomeMessage,
                    mentions: [participant], // Marca o novo participante
                });
            } else if (action === 'remove') {
                // Mensagem de despedida
                const farewellMessage = `😢 Lá se vai @${participant.split('@')[0]}. Boa sorte e até mais!`;
                await sock.sendMessage(idChat, {
                    text: farewellMessage,
                    mentions: [participant], // Marca o participante que saiu
                });
            }
        }
    } catch (err) {
        console.error('Erro ao processar atualização de participantes:', err);
    }
};
