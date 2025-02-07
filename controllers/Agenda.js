import fetch from 'node-fetch';
import moment from 'moment';

const agendarTarefa = async (detalhes, horario, idChat) => {
    const dataAgendamento = moment(horario, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss');

    if (!moment(dataAgendamento, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
        return '❌ O horário fornecido não é válido. Use o formato: DD/MM/YYYY HH:mm';
    }

    try {
        const response = await fetch(`http://localhost:8080/api/agendar/${idChat}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao: detalhes, horario: dataAgendamento }),
        });

        const responseBody = await response.json();
        return response.ok ? responseBody.message : '❌ Falha ao agendar a tarefa.';
    } catch (error) {
        console.error('Erro ao agendar tarefa:', error);
        return '❌ Ocorreu um erro ao tentar agendar a tarefa.';
    }
};



const getTarefas = async (idChat) => {
    try {
        const response = await fetch(`http://localhost:8080/api/tarefas/${idChat}`);
        const tarefas = await response.json();

        if (!response.ok || tarefas.length === 0) {
            return '🔍 Nenhuma tarefa encontrada para este chat.';
        }

        // Formatar todas as tarefas com um número para exclusão
        let listaTarefas = tarefas.map((t, index) => `📌 *${index + 1}.* ${t.descricao} - 🕒 ${moment(t.horario).format('DD/MM/YYYY HH:mm')}`).join('\n');

        return `Aqui estão suas tarefas:\n${listaTarefas}\n\nPara excluir uma tarefa, envie o número da tarefa (ex: "Excluir 2")`;
    } catch (error) {
        console.error('❌ Erro ao buscar tarefas:', error);
        return '❌ Ocorreu um erro ao buscar as tarefas.';
    }
};



const handleVerTarefas = async (msg, sock) => {
    const idChat = msg.key.remoteJid;
    const resposta = await getTarefas(idChat);
    await sock.sendMessage(idChat, { text: resposta });
};


const extractText = (msg) => {
    console.log('Mensagem extraída:', msg);
    return msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '';
};



const handleAgendar = async (msg, sock) => {
    const textoRecebido = extractText(msg).trim();

    if (!textoRecebido.startsWith('!agendar ')) return;

    const comandoSemPrefixo = textoRecebido.replace('!agendar ', '');
    const match = comandoSemPrefixo.match(/(.+)\s(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2})$/);

    if (!match) {
        await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Formato incorreto! Use: !agendar <tarefa> <DD/MM/YYYY HH:mm>' });
        return;
    }

    const detalhes = match[1].trim();
    const horario = match[2].trim();
    const resposta = await agendarTarefa(detalhes, horario, msg.key.remoteJid);

    await sock.sendMessage(msg.key.remoteJid, { text: resposta });
};



export { handleAgendar, handleVerTarefas };
