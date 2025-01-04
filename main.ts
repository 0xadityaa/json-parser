import { tokenizer } from "./tokenizer.ts";
import { parser } from "./parser.ts";

const colors = {
  red: (str: string) => `\x1b[31m${str}\x1b[0m`,
  green: (str: string) => `\x1b[32m${str}\x1b[0m`,
  blue: (str: string) => `\x1b[34m${str}\x1b[0m`,
  yellow: (str: string) => `\x1b[33m${str}\x1b[0m`,
  bold: (str: string) => `\x1b[1m${str}\x1b[0m`,
};

async function fetchJson(url: string): Promise<string> {
  try {
    console.log(colors.blue("Fetching JSON from URL..."));
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch JSON: ${response.statusText}`);
    }
    console.log(colors.green("✓ Successfully fetched JSON"));
    return response.text();
  } catch (error) {
    throw new Error(
      `Failed to fetch JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function printHelp(): void {
  console.log(colors.bold("\nJSON Parser CLI\n"));
  console.log("Usage:");
  console.log(
    "  deno run --allow-read --allow-net main.ts [options] <input>\n",
  );
  console.log("Options:");
  console.log("  --help, -h     Show this help message");
  console.log("  --version, -v  Show version number");
  console.log("  --pretty, -p   Pretty print the output");
  console.log("  --watch, -w    Watch for changes and output parsed result\n");
  console.log("Input:");
  console.log("  Can be either a local file path or a URL\n");
  console.log("Examples:");
  console.log("  deno run --allow-read main.ts ./data.json");
  console.log(
    "  deno run --allow-net main.ts https://api.example.com/data.json",
  );
  console.log("  deno run --allow-read main.ts --pretty ./data.json\n");
}

function printVersion(): void {
  console.log("json-parser v1.0.0");
}

async function benchmarkJson(input: string) {
  const startTime = performance.now();

  let jsonString: string;
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const fetchStart = performance.now();
    jsonString = await fetchJson(input);
    const fetchEnd = performance.now();
    console.log(`Time to fetch JSON: ${(fetchEnd - fetchStart).toFixed(2)} ms`);
  } else {
    const readStart = performance.now();
    jsonString = await Deno.readTextFile(input);
    const readEnd = performance.now();
    console.log(`Time to read file: ${(readEnd - readStart).toFixed(2)} ms`);
  }

  const tokenizeStart = performance.now();
  const tokens = tokenizer(jsonString);
  const tokenizeEnd = performance.now();
  console.log(
    `Time to tokenize: ${(tokenizeEnd - tokenizeStart).toFixed(2)} ms`,
  );

  const parseStart = performance.now();
  const result = parser(tokens);
  const parseEnd = performance.now();
  console.log(`Time to parse: ${(parseEnd - parseStart).toFixed(2)} ms`);

  const totalEnd = performance.now();
  console.log(`Total time: ${(totalEnd - startTime).toFixed(2)} ms`);
}

async function main() {
  const args = Deno.args;

  if (args.length === 0) {
    console.error(colors.red("Error: No input provided"));
    printHelp();
    Deno.exit(1);
  }

  let prettyPrint = false;
  let watchMode = false;
  let input = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--help":
      // deno-lint-ignore no-fallthrough
      case "-h":
        printHelp();
        Deno.exit(0);

      case "--version":
      // deno-lint-ignore no-fallthrough
      case "-v":
        printVersion();
        Deno.exit(0);

      case "--pretty":
      case "-p":
        prettyPrint = true;
        break;

      case "--watch":
      case "-w":
        watchMode = true;
        break;

      case "--benchmark":
        await benchmarkJson(input);
        Deno.exit(0);

      default:
        if (!input && !arg.startsWith("-")) {
          input = arg;
        }
    }
  }

  if (!input) {
    console.error(colors.red("Error: No input file or URL provided"));
    printHelp();
    Deno.exit(1);
  }

  try {
    let jsonString: string;

    if (input.startsWith("http://") || input.startsWith("https://")) {
      jsonString = await fetchJson(input);
    } else {
      console.log(colors.blue("Reading file..."));
      jsonString = await Deno.readTextFile(input);
      console.log(colors.green("✓ File read successfully"));
    }

    console.log(colors.blue("Tokenizing..."));
    const tokens = tokenizer(jsonString);
    console.log(colors.green("✓ Tokenization complete"));

    console.log(colors.blue("Parsing..."));
    const result = parser(tokens);
    console.log(colors.green("✓ Parsing complete\n"));

    if (watchMode) {
      if (prettyPrint) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(JSON.stringify(result));
      }
    }
  } catch (error) {
    console.error(
      colors.red(
        `\nError: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(
      colors.red(
        `\nError: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    Deno.exit(1);
  });
}
