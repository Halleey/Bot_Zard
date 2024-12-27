const startTime = new Date(); 

export const botInfo = {
    owner: "Zard", 
    botName: "ZardBot", 
    version: "2.0.0", 
    description: "Um bot multifuncional para WhatsApp.",
    iniciar: "Digite !menu para começar",
    uptime: () => {
        const currentTime = new Date();
        const diff = Math.abs(currentTime - startTime);
        const hours = Math.floor(diff / 36e5);
        const minutes = Math.floor((diff % 36e5) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    },
};
