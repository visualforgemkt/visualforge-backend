import OpenAI from "openai";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: "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"
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, agent } = req.body;
    
    let system = "Você é um assistente útil. Responda em português.";
    
    if (agent === "redes") {
      system = "Você é especialista em redes sociais. Crie posts educativos com emojis e hashtags para Instagram e Facebook.";
    } else if (agent === "atendimento") {
      system = "Você é assistente pediátrico do Dr. Grégori. Responda dúvidas de pais sobre saúde infantil. Seja acolhedor e educativo.";
    } else if (agent === "pais") {
      system = "Você é educador de saúde infantil. Oriente sobre desenvolvimento, vacinação, alimentação e sono. Seja encorajador.";
    } else if (agent === "conteudo") {
      system = "Você é redator de conteúdo educativo. Crie textos claros e informativos sobre saúde infantil para pais.";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      system_prompt: system,
      messages: messages
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("✅ Server running with OpenAI"));
