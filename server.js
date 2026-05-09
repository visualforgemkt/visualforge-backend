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
