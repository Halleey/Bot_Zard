import { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { connectHandlers } from './handlers/connectHandlers.js';
import moment from "moment-timezone";

// Configurando o fuso horário
moment.tz.setDefault('America/Sao_Paulo');

// Função principal para conectar ao WhatsApp
async function connectToWhatsApp() {
    try {
        const { state: authState, saveCreds } = await useMultiFileAuthState('./auth');
        const { version: waVersion } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            auth: authState,
            version: waVersion,
            printQRInTerminal: true,
        });

        // Encaminha os eventos para os manipuladores
        connectHandlers(sock, saveCreds);

        return sock;
    } catch (error) {
        console.error('❌ Erro ao conectar ao WhatsApp:', error);
    }
}

// Tratamento de exceções globais
process.on('unhandledRejection', (reason) => {
    console.error('⚠️ Erro não tratado:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Exceção não tratada:', error);
});

// Inicia a conexão com o WhatsApp
connectToWhatsApp();
