export const handleReconnection = async (lastDisconnect, saveCreds) => {
    const isLoggedOut = lastDisconnect?.error?.output?.statusCode === 401;

    if (isLoggedOut) {
        console.error('❌ Logout detectado. Por favor, faça login novamente.');
        process.exit(1);
    } else {
        console.error('⚠️ Conexão perdida. Tentando reconectar...');
        setTimeout(() => connectToWhatsApp(saveCreds), 5000);
    }
};
