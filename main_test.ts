import { assertEquals } from "@std/assert";
import { parser } from "./parser.ts";
import { tokenizer } from "./tokenizer.ts";

Deno.test("parser should correctly parse an empty JSON object", () => {
  const jsonString = `{}`;
  const tokens = tokenizer(jsonString);
  const ast = parser(tokens);
  
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
  const ast = parser(tokens);
  
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
  const ast = parser(tokens);
  
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
  } catch (e: any) {
    assertEquals(e.message, "Unexpected token type: BraceClose");
  }
});