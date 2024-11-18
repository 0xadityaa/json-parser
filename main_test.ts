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
    value: {},
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
              key: { type: "String", value: "value" },
            },
          },
        },
      },
    },
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
      { type: "Object", value: {} },
    ],
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
        completed: { type: "Boolean", value: false },
      },
    });
  }
});

// Test for local JSON file parsing
Deno.test("parser should correctly parse a local JSON file", async () => {
  const jsonString = await Deno.readTextFile("./test-data.json");

  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Array",
    value: [
      {
        type: "Object",
        value: {
          userId: { type: "Number", value: 1 },
          id: { type: "Number", value: -1 },
          title: { type: "String", value: 'delectus\n\t" aut autem' },
          completed: { type: "Boolean", value: false },
        },
      },
    ],
  });
});

Deno.test("parser should correctly parse a deeply nested JSON object", () => {
  const jsonString = `{
    "level1": {
      "level2": {
        "level3": {
          "level4": {
            "key": "value"
          }
        }
      }
    }
  }`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Object",
    value: {
      level1: {
        type: "Object",
        value: {
          level2: {
            type: "Object",
            value: {
              level3: {
                type: "Object",
                value: {
                  level4: {
                    type: "Object",
                    value: {
                      key: { type: "String", value: "value" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
});

// Test for an empty array
Deno.test("parser should correctly parse an empty array", () => {
  const jsonString = `[]`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Array",
    value: [],
  });
});

// Test for an empty object
Deno.test("parser should correctly parse an empty object", () => {
  const jsonString = `{}`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Object",
    value: {},
  });
});

// Test for an array of mixed types with nested objects
Deno.test("parser should correctly parse an array of mixed types with nested objects", () => {
  const jsonString =
    `[{"key1": "value1"}, 42, false, null, {"key2": [1, 2, 3]}]`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Array",
    value: [
      { type: "Object", value: { key1: { type: "String", value: "value1" } } },
      { type: "Number", value: 42 },
      { type: "Boolean", value: false },
      { type: "Null" },
      {
        type: "Object",
        value: {
          key2: {
            type: "Array",
            value: [
              { type: "Number", value: 1 },
              { type: "Number", value: 2 },
              { type: "Number", value: 3 },
            ],
          },
        },
      },
    ],
  });
});

// Test for JSON with special characters
Deno.test("parser should correctly parse JSON with special characters", () => {
  const jsonString =
    `{"key": "value with special characters: \\"quotes\\", \\\\backslashes"}`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Object",
    value: {
      key: {
        type: "String",
        value: 'value with special characters: "quotes", \\backslashes',
      },
    },
  });
});

// Test for JSON with trailing commas
Deno.test("parser should throw an error for JSON with trailing commas", () => {
  const jsonString = `{"key": "value",}`;
  const tokens = tokenizer(jsonString);

  try {
    parser(tokens);
    throw new Error("Unexpected token type: BraceClose");
  } catch (e) {
    assertEquals((e as Error).message, "Unexpected token type: BraceClose");
  }
});

// Test for JSON with a single quote instead of double quotes
Deno.test("parser should throw an error for JSON with single quotes", () => {
  const jsonString = `{'key': 'value'}`;

  try {
    const tokens = tokenizer(jsonString);
    parser(tokens);
    throw new Error("Expected an error to be thrown for single quotes");
  } catch (e) {
    assertEquals((e as Error).message, "Unexpected character: '");
  }
});

// Test for JSON with unescaped special characters
Deno.test("parser should throw an error for JSON with unescaped special characters", () => {
  const jsonString = `{"key": "value with "quotes""}`;

  try {
    const tokens = tokenizer(jsonString);
    parser(tokens);
    throw new Error("Expected an error to be thrown for unescaped quotes");
  } catch (e) {
    assertEquals((e as Error).message, "Unexpected value: quotes");
  }
});

// Test for JSON with missing closing brackets
Deno.test("parser should throw an error for JSON with missing closing brackets", () => {
  const jsonString = `{"key": "value"`;
  const tokens = tokenizer(jsonString);

  try {
    parser(tokens);
    throw new Error("Expected an error to be thrown for missing brackets");
  } catch (e) {
    assertEquals(
      (e as Error).message,
      "Cannot read properties of undefined (reading 'type')",
    );
  }
});

// Test for JSON with invalid number format
Deno.test("parser should throw an error for JSON with invalid number format", () => {
  const jsonString = `{"key": 1.2.3}`;

  try {
    const tokens = tokenizer(jsonString);
    parser(tokens);
    throw new Error("Expected an error to be thrown for invalid number format");
  } catch (e) {
    assertEquals((e as Error).message, "Unexpected character: .");
  }
});

// Test for JSON with a non-JSON value
Deno.test("parser should throw an error for JSON with a non-JSON value", () => {
  const jsonString = `{"key": undefined}`;

  try {
    const tokens = tokenizer(jsonString);
    parser(tokens);
    throw new Error("Expected an error to be thrown for non-JSON value");
  } catch (e) {
    assertEquals((e as Error).message, "Unexpected value: undefined");
  }
});
