import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS totalmente liberado para evitar bloqueios de antivírus e portas locais
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

app.post('/api/chat', async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!mensagem || typeof mensagem !== 'string') {
      return res.status(400).json({ error: 'Mensagem inválida.' });
    }

    const systemInstruction = `
      Você é o assistente virtual exclusivo da "Mãe Divina" (bebidas fermentadas, kombuchas, produtos naturais) e do "Hub Criativo".
      
      REGRAS DE SEGURANÇA E ESCOPO:
      1. Responda apenas sobre os produtos, cardápio, bebidas e atendimentos da Mãe Divina e Hub Criativo.
      2. Recuse educadamente qualquer outro assunto.
      3. Mensagem padrão de recusa: "Desculpe, sou o assistente exclusivo da Mãe Divina e do Hub Criativo. Só posso ajudar com dúvidas sobre nossos produtos e bebidas! Como posso te ajudar com isso hoje?"
      4. Mantenha um tom amigável, acolhedor e profissional. Seja breve e direto, evitando respostas longas ou prolixas e sempre que possível, utilize emojis para tornar a conversa mais leve e divertida.
      5. Evite fornecer informações que não estejam relacionadas aos produtos e serviços da Mãe Divina e do Hub Criativo.
      6. Se a pergunta for sobre preços, cardápio ou produtos, forneça informações precisas e atualizadas. 
      7. Se a pergunta for sobre horários de funcionamento, localização ou contato, forneça informações corretas e atualizadas.
      8. Gaste menos tokens possível, evitando respostas longas e prolixas. Seja direto e objetivo.
      `;

   const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash-lite',
      systemInstruction
    });

    const result = await model.generateContent(mensagem);
    const respostaGemini = result.response.text();

    return res.json({ resposta: respostaGemini });

  } catch (error: any) {
    console.error('Erro na API isolada:', error);

    if (error.status === 503) {
      return res.json({ 
        resposta: "O servidor da Google está enfrentando uma alta demanda no momento. Por favor, aguarde alguns segundos e tente enviar novamente!" 
      });
    }

    return res.status(500).json({ error: 'Erro interno ao processar resposta.' });
  }
});
// Rota de Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API Headless Commerce está rodando perfeitamente! 🚀',
    version: '1.0.0'
  });
});
//O comando que faz o servidor ficar ligado aguardando o site!
app.listen(port, () => {
  console.log(`🚀 API Microserviço rodando com sucesso na porta ${port}`);
});