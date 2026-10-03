import readline from "node:readline";

import pool from "./db.js";
import { retrieve } from "./retrieve.js";
import { generateAnswer } from "./gemini.js";

async function ask(question: string): Promise<void> {
  const results = await retrieve(question, 3);

  console.log("\n--- Retrieved chunks ---");

  for (const result of results) {
    console.log(`\nScore: ${Number(result.score).toFixed(4)}`);
    console.log(`Source: ${result.source}`);
    console.log(`Text: ${result.content}`);
  }

  const context = results
    .map(
      (result, index) =>
        `[Source ${index + 1} - ${result.source}]\n${result.content}`
    )
    .join("\n\n");

  const answer = await generateAnswer(question, context);

  console.log("\n--- Final answer ---");
  console.log(answer);
}

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(" ").trim();

  if (question) {
    await ask(question);
    await pool.end();
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Simple RAG");
  console.log('Ask a question, or type "exit" to quit.\n');

  const prompt = (): void => {
    rl.question("> ", async (input) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === "exit") {
        rl.close();
        await pool.end();
        return;
      }

      if (!trimmed) {
        prompt();
        return;
      }

      try {
        await ask(trimmed);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("\nQuery failed:", message);
      }

      console.log();
      prompt();
    });
  };

  prompt();
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nQuery failed:", message);
  await pool.end();
  process.exitCode = 1;
});
