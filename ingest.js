import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pool from "./db.js";
import { createEmbedding } from "./gemini.js";
import { chunkDocument } from "./chunk.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const documentsDir = path.join(__dirname, "documents");
  const files = fs
    .readdirSync(documentsDir)
    .filter((file) => file.endsWith(".txt"));

  if (files.length === 0) {
    throw new Error("No .txt files found in documents/");
  }

  // Keep reruns simple for this learning project.
  await pool.query("TRUNCATE TABLE documents RESTART IDENTITY");

  let chunkCount = 0;

  for (const file of files) {
    const filePath = path.join(documentsDir, file);
    const text = fs.readFileSync(filePath, "utf8");
    const chunks = chunkDocument(text);

    console.log(`\\n${file}: ${chunks.length} chunks`);

    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk);

      await pool.query(
        `
        INSERT INTO documents (source, content, embedding)
        VALUES ($1, $2, $3::vector)
        `,
        [file, chunk, `[${embedding.join(",")}]`]
      );

      chunkCount++;
      console.log(`  ✓ embedded chunk ${chunkCount}`);
    }
  }

  console.log(`\\nIndexed ${chunkCount} chunks.`);
}

main()
  .catch((error) => {
    console.error("\\nIngestion failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
