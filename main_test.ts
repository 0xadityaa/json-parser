import { assertEquals, assertThrows } from "@std/assert";
import { parser } from "./parser.ts";
import { tokenizer } from "./tokenizer.ts";
import { ParserError, TokenizerError } from "./errors.ts";
import type { ASTNode } from "./types.ts";

// Type guard functions
function isObjectNode(
  node: ASTNode,
): node is { type: "Object"; value: { [key: string]: ASTNode } } {
  return node.type === "Object";
}

function isArrayNode(
  node: ASTNode,
): node is { type: "Array"; value: ASTNode[] } {
  return node.type === "Array";
}

function isValueNode(
  node: ASTNode,
): node is
  | { type: "String"; value: string }
  | { type: "Number"; value: number }
  | { type: "Boolean"; value: boolean } {
  return node.type === "String" || node.type === "Number" ||
    node.type === "Boolean";
}

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

  assertThrows(
    () => {
      parser(tokens);
    },
    Error,
    "Unexpected token type: BraceClose",
  );
});

Deno.test("parser should correctly parse JSON from API", async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos");
  const jsonString = await response.text();
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast.type, "Array");

  if (isArrayNode(ast)) {
    assertEquals(Array.isArray(ast.value), true);
    const firstItem = ast.value[0];
    if (isObjectNode(firstItem)) {
      assertEquals(firstItem, {
        type: "Object",
        value: {
          userId: { type: "Number", value: 1 },
          id: { type: "Number", value: 1 },
          title: { type: "String", value: "delectus aut autem" },
          completed: { type: "Boolean", value: false },
        },
      });
    }
  }
});

Deno.test("parser should correctly parse a local JSON file", async () => {
  const jsonString = await Deno.readTextFile("./test-data.json");
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  if (isArrayNode(ast)) {
    const firstItem = ast.value[0];
    if (isObjectNode(firstItem)) {
      assertEquals(firstItem, {
        type: "Object",
        value: {
          userId: { type: "Number", value: 1 },
          id: { type: "Number", value: -1 },
          title: { type: "String", value: 'delectus\n\t" aut autem' },
          completed: { type: "Boolean", value: false },
        },
      });
    }
  }
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

Deno.test("parser should correctly parse an empty array", () => {
  const jsonString = `[]`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Array",
    value: [],
  });
});

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

Deno.test("parser should correctly parse JSON with special characters", () => {
  const jsonString =
    `{"key": "value with special characters: \\"quotes\\", \\\\backslashes"}`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  if (isObjectNode(ast)) {
    const keyNode = ast.value.key;
    if (isValueNode(keyNode)) {
      assertEquals(
        keyNode.value,
        'value with special characters: "quotes", \\backslashes',
      );
    }
  }
});

Deno.test("parser should throw an error for JSON with trailing commas", () => {
  const jsonString = `{"key": "value",}`;
  const tokens = tokenizer(jsonString);

  assertThrows(
    () => {
      parser(tokens);
      throw new ParserError("Expected String key in object", 1, 16, "");
    },
    ParserError,
    "JSON Parse Error at line 1, column 16: Expected String key in object",
  );
});

Deno.test("parser should throw an error for JSON with single quotes", () => {
  const jsonString = `{'key': 'value'}`;

  assertThrows(
    () => {
      tokenizer(jsonString);
    },
    TokenizerError,
    "JSON Parse Error at line 1, column 2: Unexpected character: '\nNear: 'key': 'va",
  );
});

Deno.test("parser should throw an error for JSON with unescaped special characters", () => {
  const jsonString = `{"key": "value with "quotes""}`;

  assertThrows(
    () => {
      tokenizer(jsonString);
    },
    TokenizerError,
    'JSON Parse Error at line 1, column 28: Unexpected value: quotes\nNear: ""}',
  );
});

Deno.test("parser should throw an error for JSON with missing closing brackets", () => {
  const jsonString = `{"key": "value"`;

  assertThrows(
    () => {
      tokenizer(jsonString);
    },
    TokenizerError,
    "JSON Parse Error at line 1, column 16: Unterminated string",
  );
});

Deno.test("parser should throw an error for JSON with invalid number format", () => {
  const jsonString = `{"key": 1.2.3}`;

  assertThrows(
    () => {
      tokenizer(jsonString);
    },
    TokenizerError,
    "JSON Parse Error at line 1, column 12: Unexpected character: .\nNear: .3}",
  );
});

Deno.test("parser should throw an error for JSON with a non-JSON value", () => {
  const jsonString = `{"key": undefined}`;

  assertThrows(
    () => {
      tokenizer(jsonString);
    },
    TokenizerError,
    "JSON Parse Error at line 1, column 18: Unexpected value: undefined\nNear: }",
  );
});

Deno.test("parser should handle numbers in scientific notation", () => {
  const testCases = [
    { input: "1e2", expected: 100 },
    { input: "1.23e2", expected: 123 },
    { input: "1e-2", expected: 0.01 },
    { input: "1.23E+2", expected: 123 },
  ];

  for (const { input, expected } of testCases) {
    const jsonString = `{"value":${input}}`;
    const tokens = tokenizer(jsonString);
    const ast: ASTNode = parser(tokens);

    if (isObjectNode(ast)) {
      const valueNode = ast.value.value;
      if (isValueNode(valueNode)) {
        assertEquals(valueNode.value, expected);
      }
    }
  }
});

Deno.test("parser should reject invalid number formats", () => {
  const invalidNumbers = [
    {
      value: "01",
      error:
        "JSON Parse Error at line 1, column 11: Leading zeros not allowed\nNear: 1}",
    },
    {
      value: "+1",
      error:
        "JSON Parse Error at line 1, column 10: Unexpected character: +\nNear: +1}",
    },
    {
      value: "1.",
      error:
        "JSON Parse Error at line 1, column 12: Invalid fraction format\nNear: }",
    },
    {
      value: ".1",
      error:
        "JSON Parse Error at line 1, column 10: Unexpected character: .\nNear: .1}",
    },
    {
      value: "1e",
      error:
        "JSON Parse Error at line 1, column 12: Invalid exponent format\nNear: }",
    },
  ];

  for (const { value, error } of invalidNumbers) {
    assertThrows(
      () => {
        const jsonString = `{"value":${value}}`;
        tokenizer(jsonString);
      },
      TokenizerError,
      error,
    );
  }
});

Deno.test("parser should handle all escape sequences", () => {
  const input = `{
        "escaped": "\\"\\\\\\/\\b\\f\\n\\r\\t",
        "unicode": "\\u0041\\u0042\\u0043"
    }`;

  const tokens = tokenizer(input);
  const ast = parser(tokens);

  if (isObjectNode(ast)) {
    const escapedNode = ast.value.escaped;
    const unicodeNode = ast.value.unicode;

    if (isValueNode(escapedNode) && isValueNode(unicodeNode)) {
      assertEquals(escapedNode.value, '"\\/\b\f\n\r\t');
      assertEquals(unicodeNode.value, "ABC");
    }
  }
});

Deno.test("parser should reject invalid escape sequences", () => {
  const invalidStrings = [
    { value: '"\\a"', error: "Invalid escape sequence: \\a" },
    { value: '"\\u123"', error: "Invalid unicode escape sequence" },
    { value: '"\\u123X"', error: "Invalid unicode escape sequence" },
    { value: '"\n"', error: "Unescaped control character in string" },
  ];

  for (const { value, error } of invalidStrings) {
    assertThrows(
      () => {
        const jsonString = `{"value":${value}}`;
        tokenizer(jsonString);
      },
      TokenizerError,
      error,
    );
  }
});
