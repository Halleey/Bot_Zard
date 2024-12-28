import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Hercai } from 'hercai';

const herc = new Hercai();
const downloadsDir = path.resolve('./downloads');

// Garante que o diretório de downloads existe
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

export const gerarImagemComDetalhe = async (detalhes, chatId, sock) => {
  try {
    // Gera a imagem com base nos detalhes fornecidos
    const respostaHercai = await herc.drawImage({ model: 'prodia', prompt: detalhes });

    // Validação da resposta da API
    if (!respostaHercai || typeof respostaHercai !== 'object') {
      return { erro: 'Erro inesperado: resposta inválida do Hercai.' };
    }

    if (respostaHercai.status === 404) {
      return { erro: 'Texto inválido ou não pode ser criado.' };
    } else if (respostaHercai.status === 406) {
      return { erro: 'Erro na criação da imagem, projeto está em BETA.' };
    }

    if (!respostaHercai.url) {
      return { erro: 'Erro no servidor, tente novamente mais tarde.' };
    }

    const imagemUrl = respostaHercai.url;
    console.log('URL da imagem gerada: ', imagemUrl);

    // Define o caminho para salvar a imagem
    const imagePath = path.join(downloadsDir, `image_${Date.now()}.png`);
    const writer = fs.createWriteStream(imagePath);

    // Baixa a imagem
    const response = await axios({
      url: imagemUrl,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    // Aguarda o término do download
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log('Imagem salva com sucesso!');

    // Envia a imagem para o WhatsApp
    if (fs.existsSync(imagePath)) {
      const media = fs.readFileSync(imagePath);

      await sock.sendMessage(chatId, {
        image: media, // Envia como imagem
        caption: 'Aqui está sua imagem gerada!',
        mimetype: 'image/png',
      });

      console.log('Imagem enviada com sucesso!');

      // Remove a imagem do disco após o envio
      fs.unlinkSync(imagePath);
      console.log('Imagem deletada do diretório local.');
    } else {
      console.error('Erro: O arquivo de imagem não foi encontrado no caminho:', imagePath);
      return { erro: '❌ Ocorreu um erro ao processar a imagem. Tente novamente mais tarde.' };
    }
  } catch (error) {
    console.error('Erro ao gerar ou processar a imagem:', error.message);
    return { erro: '❌ Ocorreu um erro inesperado. Tente novamente mais tarde.' };
  }
};
