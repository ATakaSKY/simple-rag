const readline = require("readline");

const pool = require("./db");
const { retrieve } = require("./retrieve");
const { generateAnswer } = require("./gemini");

async function ask(question) {
  const results = await retrieve(question, 3);

  console.log("\\n--- Retrieved chunks ---");

  for (const result of results) {
    console.log(`\\nScore: ${Number(result.score).toFixed(4)}`);
    console.log(`Source: ${result.source}`);
    console.log(`Text: ${result.content}`);
  }

  const context = results
    .map(
      (result, index) =>
        `[Source ${index + 1} - ${result.source}]\\n${result.content}`
    )
    .join("\\n\\n");

  const answer = await generateAnswer(question, context);

  console.log("\\n--- Final answer ---");
  console.log(answer);
}

async function main() {
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
  console.log('Ask a question, or type "exit" to quit.\\n');

  const prompt = () => {
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
      } catch (error) {
        console.error("\\nQuery failed:", error.message);
      }

      console.log();
      prompt();
    });
  };

  prompt();
}

main().catch(async (error) => {
  console.error("\\nQuery failed:", error.message);
  await pool.end();
  process.exitCode = 1;
});
