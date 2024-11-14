import { tokenizer } from './tokenizer.ts';
import { parser } from './parser.ts';

async function fetchJson(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch JSON: ${response.statusText}`);
  }
  return response.text();
}

async function main(input: string) {
  let jsonString: string;

  if (input.startsWith('http://') || input.startsWith('https://')) {
    jsonString = await fetchJson(input);
  } else {
    jsonString = await Deno.readTextFile(input);
  }

  console.log(parser(tokenizer(jsonString)));
}

if (import.meta.main) {
  const input = Deno.args[0]; // Get the input from command line arguments
  main(input).catch(console.error);
}
