export function chunkDocument(text: string): string[] {
  // Deliberately simple for learning:
  // each paragraph becomes one chunk.
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}
