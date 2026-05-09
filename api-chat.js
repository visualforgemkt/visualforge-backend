import Anthropic from "@anthropic-ai/sdk";

// ✅ API Key segura em variável de ambiente
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Definição dos agentes com contexto personalizado
const agents = {
  atendimento: {
    name: "Atendimento 24h",
    system: `Você é assistente pediátrico do Dr. Grégori Bertagnolli (CRM SC 22171).
Responda dúvidas de pais sobre sintomas comuns em crianças (febre, tosse, vômito, diarreia, cólica).
IMPORTANTE:
- Seja acolhedor, empático e claro
- NUNCA dê diagnóstico
- Sempre oriente a procurar o consultório se necessário
- Máximo 3 parágrafos
- Português brasileiro`
  },
  pais: {
    name: "Orientação Pais",
    system: `Você é educador de saúde infantil especializado em desenvolvimento pediátrico.
Oriente pais sobre:
- Desenvolvimento infantil e marcos
- Vacinação
- Alimentação adequada
- Rotina de sono
- Primeiros socorros
IMPORTANTE:
- Baseie-se em evidências científicas
- Seja encorajador, positivo e prático
- Português brasileiro`
  },
  conteudo: {
    name: "Conteúdo Educativo",
    system: `Você é redator de conteúdo educativo especializado em saúde infantil.
Crie textos claros, bem estruturados e informativos sobre saúde infantil para pais.
IMPORTANTE:
- Inclua dicas práticas baseadas em evidências científicas
- Linguagem acessível para pais
- Estrutura clara com tópicos
- Português brasileiro`
  },
  redes: {
    name: "Redes Sociais",
    system: `Você é especialista em marketing médico para pediatria.
Crie posts educativos e humanizados para Instagram e Facebook.
IMPORTANTE:
- Posts com call-to-action claro
- Inclua hashtags relevantes (#pediatria #saude #criancas)
- Use emojis apropriados
- Linguagem descontraída mas profissional
- Português brasileiro`
  }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Apenas POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, agent } = req.body;

    // Validar entrada
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    if (!agent || !agents[agent]) {
      return res.status(400).json({ error: "Invalid agent" });
    }

    // Verificar API Key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("❌ ANTHROPIC_API_KEY não está configurada!");
      return res.status(500).json({ 
        error: "Server error: API key not configured",
        details: "Backend misconfiguration"
      });
    }

    const agentConfig = agents[agent];

    // Chamar Claude API
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: agentConfig.system,
      messages: messages
    });

    // Extrair resposta
    const text = response.content[0]?.type === "text" ? response.content[0].text : null;

    if (!text) {
      console.error("❌ Claude retornou resposta vazia");
      return res.status(500).json({ 
        error: "Empty response from AI",
        details: "No content received"
      });
    }

    // ✅ Sucesso
    return res.status(200).json({
      text,
      agent: agentConfig.name,
      model: response.model,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      }
    });

  } catch (error) {
    // Tratamento de erros específicos
    console.error("❌ Erro no chat:", {
      message: error.message,
      status: error.status,
      type: error.type
    });

    // 401 - Chave inválida
    if (error.status === 401) {
      return res.status(401).json({
        error: "Authentication failed",
        details: "Invalid or expired API key",
        hint: "Please check server configuration"
      });
    }

    // 429 - Rate limit
    if (error.status === 429) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        details: "Too many requests to Anthropic",
        retryAfter: error.headers?.["retry-after"] || 60
      });
    }

    // 500+ - Erro do Anthropic
    if (error.status >= 500) {
      return res.status(503).json({
        error: "Service unavailable",
        details: "Claude API is temporarily unavailable"
      });
    }

    // Erro genérico
    return res.status(500).json({
      error: "Internal server error",
      details: error.message || "Unknown error"
    });
  }
}
