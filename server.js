import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = "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";
const client = new Anthropic({ apiKey });

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, agent } = req.body;
    
    let system = "Você é um assistente útil. Responda em português.";
    
    if (agent === "redes") {
      system = "Você é especialista em redes sociais. Crie posts educativos com emojis e hashtags.";
    } else if (agent === "atendimento") {
      system = "Você é assistente pediátrico. Responda dúvidas de pais sobre saúde infantil. Seja acolhedor.";
    } else if (agent === "pais") {
      system = "Você é educador de saúde infantil. Oriente sobre desenvolvimento, vacinação, alimentação e sono.";
    } else if (agent === "conteudo") {
      system = "Você é redator de conteúdo educativo. Crie textos claros sobre saúde infantil.";
    }

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system,
      messages
    });

    res.json({ text: response.content[0].text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("✅ Server running"));
