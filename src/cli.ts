import { readFile } from "node:fs/promises";
import { formatCircuitDocument } from "./format.js";
import { validateCircuitDocument } from "./validate.js";

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

async function main(): Promise<void> {
  const [command, ...files] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") {
    console.log("Usage:\n  circuit-format validate <file...>\n  circuit-format format <file>");
    process.exitCode = command ? 0 : 1;
    return;
  }
  if (command === "validate" && files.length > 0) {
    let failed = false;
    for (const file of files) {
      try {
        const result = validateCircuitDocument(await readJson(file));
        if (result.valid) console.log(`✓ ${file}`);
        else {
          failed = true;
          console.error(`✗ ${file}`);
          result.issues.forEach((issue) => console.error(`  ${issue.path}: ${issue.message}`));
        }
      } catch (error) {
        failed = true;
        console.error(`✗ ${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    process.exitCode = failed ? 1 : 0;
    return;
  }
  if (command === "format" && files.length === 1) {
    console.log(formatCircuitDocument(await readJson(files[0]!)).trimEnd());
    return;
  }
  throw new Error("Invalid command. Run circuit-format --help for usage.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
