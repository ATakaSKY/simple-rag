import pool from "./db.js";
import { createEmbedding } from "./gemini.js";
import type { RetrievedDocument } from "./types.js";

export async function retrieve(
  question: string,
  topK = 3
): Promise<RetrievedDocument[]> {
  const queryEmbedding = await createEmbedding(question);
  const vector = `[${queryEmbedding.join(",")}]`;

  const result = await pool.query<RetrievedDocument>(
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
