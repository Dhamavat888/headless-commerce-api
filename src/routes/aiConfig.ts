import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const configFilePath = path.join(__dirname, '../../src/data/ai-rules.json');

// Garante que o diretório e o arquivo padrão existam ao iniciar
const dataDir = path.dirname(configFilePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(configFilePath)) {
  const initialConfig = {
    version: "1.0.0",
    last_updated: new Date().toISOString(),
    brand: "Mãe Divina",
    pillars: ["Gastronomia", "TI", "Direção de Arte"],
    rules: [
      "Priorizar ingredientes locais e orgânicos da Mantiqueira.",
      "Manter rigor técnico nas operações financeiras e de tarefas."
    ]
  };
  fs.writeFileSync(configFilePath, JSON.stringify(initialConfig, null, 2), 'utf-8');
}

// GET: Lê o JSON de diretrizes da IA
router.get('/', (req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(configFilePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Erro ao ler regras da IA:', error);
    res.status(500).json({ error: 'Erro interno ao carregar regras da IA.' });
  }
});

// POST: Atualiza o JSON e sincroniza instantaneamente
router.post('/', (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    newConfig.last_updated = new Date().toISOString();
    
    fs.writeFileSync(configFilePath, JSON.stringify(newConfig, null, 2), 'utf-8');
    
    console.log('[AI SYNC] Arquivo ai-rules.json atualizado com sucesso.');
    res.json({ message: 'Regras da IA atualizadas e sincronizadas com sucesso!', config: newConfig });
  } catch (error) {
    console.error('Erro ao atualizar regras da IA:', error);
    res.status(500).json({ error: 'Erro interno ao salvar regras da IA.' });
  }
});

export default router;