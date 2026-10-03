require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const embeddingDimensions = Number(
  process.env.GEMINI_EMBEDDING_DIMENSIONS || 768
);

async function createEmbedding(text) {
  const response = await ai.models.embedContent({
    model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    contents: text,
    config: {
      outputDimensionality: embeddingDimensions,
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values?.length) {
    throw new Error("Gemini returned no embedding values.");
  }

  return values;
}

async function generateAnswer(question, context) {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash-lite",
    contents: `Context:\n\n${context}\n\nUser question:\n${question}`,
    config: {
      systemInstruction:
        "You are a helpful assistant answering questions about the provided internal documentation. " +
        "Use only the provided context. If the answer is not present in the context, say: " +
        '"I don\'t have enough information to answer that."',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned no answer text.");
  }

  return text;
}

module.exports = {
  createEmbedding,
  generateAnswer,
};
