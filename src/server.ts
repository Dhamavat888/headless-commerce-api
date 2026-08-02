import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcrypt';
import prisma from './prisma';
import aiConfigRoutes from './routes/aiConfig';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/ai-config', aiConfigRoutes);

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
      5. Gaste menos tokens possível, evitando respostas longas e prolixas. Seja direto e objetivo.
      `;

    // CORREÇÃO 1: Usando o identificador de modelo compatível e estável
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction
    });

    const result = await model.generateContent(mensagem);
    const respostaGemini = result.response.text();

    return res.json({ resposta: respostaGemini });

  } catch (error: any) {
    console.error('Erro na API isolada:', error);

    // CORREÇÃO 2: Verificação mais robusta de status/mensagem de alta demanda
    const statusCode = error?.status || error?.statusCode;
    if (statusCode === 503 || (error?.message && error.message.includes('503'))) {
      return res.json({ 
        resposta: "O servidor da Google está enfrentando uma alta demanda no momento. Por favor, aguarde alguns segundos e tente enviar novamente!" 
      });
    }

    return res.status(500).json({ error: 'Erro interno ao processar resposta.' });
  }
});

// ==========================================
// 🛡️ MÓDULO: HUB DE OPERAÇÕES (MÃE DIVINA OS)
// ==========================================

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'WORKER',
      },
    });

    return res.status(201).json({
      message: 'Trabalhador cadastrado com sucesso!',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar trabalhador.' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, category, estimatedHours, baseHourlyRate, totalValue } = req.body;

    // CORREÇÃO 3: Validação de segurança para impedir tarefas sem título
    if (!title) {
      return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        category,
        estimatedHours,
        baseHourlyRate,
        totalValue,
        status: 'TODO'
      },
    });

    return res.status(201).json({
      message: 'Microserviço listado no quadro de tarefas!',
      task: newTask
    });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return res.status(500).json({ error: 'Erro interno ao criar a tarefa.' });
  }
});

app.get('/api/tasks/available', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { status: 'TODO' },
      orderBy: { createdAt: 'desc' }
    });
    
    return res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    return res.status(500).json({ error: 'Erro ao buscar o catálogo de serviços.' });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API Headless Commerce está rodando perfeitamente! 🚀',
    version: '1.0.0'
  });
});

app.listen(port, () => {
  console.log(`🚀 API Microserviço rodando com sucesso na porta ${port}`);
});