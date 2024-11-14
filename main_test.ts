import { assertEquals } from "@std/assert";
import { parser } from "./parser.ts";
import { tokenizer } from "./tokenizer.ts";
import type { ASTNode } from "./types.ts";

Deno.test("parser should correctly parse an empty JSON object", () => {
  const jsonString = `{}`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);
  
  assertEquals(ast, {
    type: "Object",
    value: {}
  });
});

Deno.test("parser should correctly parse a nested JSON object", () => {
  const jsonString = `{
    "outer": {
      "inner": {
        "key": "value"
      }
    }
  }`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);
  
  assertEquals(ast, {
    type: "Object",
    value: {
      outer: {
        type: "Object",
        value: {
          inner: {
            type: "Object",
            value: {
              key: { type: "String", value: "value" }
            }
          }
        }
      }
    }
  });
});

Deno.test("parser should correctly parse an array with mixed types", () => {
  const jsonString = `[1, "string", true, null, {}]`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);
  
  assertEquals(ast, {
    type: "Array",
    value: [
      { type: "Number", value: 1 },
      { type: "String", value: "string" },
      { type: "Boolean", value: true },
      { type: "Null" },
      { type: "Object", value: {} }
    ]
  });
});

Deno.test("parser should throw an error for invalid JSON", () => {
  const jsonString = `{
    "key": "value",
    "invalid": 
  }`;
  
  const tokens = tokenizer(jsonString);
  
  try {
    parser(tokens);
    throw new Error("Expected an error to be thrown for invalid JSON");
  } catch (e) {
    assertEquals((e as Error).message, "Unexpected token type: BraceClose");
  }
});

// Test for API JSON parsing
Deno.test("parser should correctly parse JSON from API", async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos");
  const jsonString = await response.text();
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);
  
  // Check if the parsed AST is an array
  assertEquals(ast.type, "Array");

  if (ast.type === "Array") {
    assertEquals(Array.isArray(ast.value), true);
    assertEquals(ast.value[0], {
      type: "Object",
      value: {
        userId: { type: "Number", value: 1 },
        id: { type: "Number", value: 1 },
        title: { type: "String", value: "delectus aut autem" },
        completed: { type: "Boolean", value: false }
      }
    });
  }
});

// Test for local JSON file parsing
Deno.test("parser should correctly parse a local JSON file", async () => {
  const jsonString = await Deno.readTextFile("./test-data.json");
  
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens); // Specify the type of ast
  
  // You can assert against the expected structure of the parsed AST
  assertEquals(ast, {
    type: "Array",
    value: [
      {
        type: "Object",
        value: {
          userId: { type: "Number", value: 1 },
          id: { type: "Number", value: 1 },
          title: { type: "String", value: "delectus aut autem" },
          completed: { type: "Boolean", value: false }
        }
      },
      // Add more expected objects based on the test-data.json structure
    ]
  });
});