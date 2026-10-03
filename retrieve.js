const pool = require("./db");
const { createEmbedding } = require("./gemini");

async function retrieve(question, topK = 3) {
  const queryEmbedding = await createEmbedding(question);
  const vector = `[${queryEmbedding.join(",")}]`;

  const result = await pool.query(
    `
    SELECT
      id,
      source,
      content,
      1 - (embedding <=> $1::vector) AS score
    FROM documents
    ORDER BY embedding <=> $1::vector
    LIMIT $2
    `,
    [vector, topK]
  );

  return result.rows;
}

module.exports = { retrieve };
