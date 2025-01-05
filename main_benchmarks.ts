import { tokenizer } from "./tokenizer.ts";
import { parser } from "./parser.ts";

function generateNestedObject(depth: number): string {
  let json = '{"key":';
  for (let i = 0; i < depth; i++) {
    json += '{"nested":';
  }
  json += '"value"' + "}".repeat(depth + 1);
  return json;
}

function generateLargeArray(size: number): string {
  const items = Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `item${i}`,
    value: Math.random() * 1000,
    active: i % 2 === 0,
    tags: [`tag${i}`, `category${i % 5}`],
    metadata: {
      created: new Date().toISOString(),
      version: `1.${i}.0`,
      complexity: i % 3,
    },
  }));
  return JSON.stringify(items);
}

const specialCharJSON = JSON.stringify({
  escaped: '"\\/\b\f\n\r\t',
  unicode: "\u0041\u0042\u0043",
  nested: {
    array: [1, 2, 3],
    object: { key: "value\nwith\tspecial\rchars" },
  },
});

// Basic parsing benchmarks
Deno.bench("Parse empty object", { group: "Basic Parsing" }, () => {
  const tokens = tokenizer("{}");
  parser(tokens);
});

Deno.bench("Parse empty array", { group: "Basic Parsing" }, () => {
  const tokens = tokenizer("[]");
  parser(tokens);
});

Deno.bench("Parse simple key-value", { group: "Basic Parsing" }, () => {
  const tokens = tokenizer('{"key":"value"}');
  parser(tokens);
});

Deno.bench("Parse integers", { group: "Number Parsing" }, () => {
  const tokens = tokenizer("[1,2,3,4,5,6,7,8,9,10]");
  parser(tokens);
});

Deno.bench("Parse floating points", { group: "Number Parsing" }, () => {
  const tokens = tokenizer("[1.1,2.2,3.3,4.4,5.5]");
  parser(tokens);
});

Deno.bench("Parse scientific notation", { group: "Number Parsing" }, () => {
  const tokens = tokenizer("[1e2,1.23e2,1e-2,1.23E+2]");
  parser(tokens);
});

Deno.bench("Parse escaped characters", { group: "String Parsing" }, () => {
  const tokens = tokenizer(specialCharJSON);
  parser(tokens);
});

Deno.bench("Parse long strings", { group: "String Parsing" }, () => {
  const longString = "x".repeat(10000);
  const tokens = tokenizer(`{"long":"${longString}"}`);
  parser(tokens);
});

Deno.bench(
  "Parse deeply nested object (depth=10)",
  { group: "Structure" },
  () => {
    const tokens = tokenizer(generateNestedObject(10));
    parser(tokens);
  },
);

Deno.bench(
  "Parse deeply nested object (depth=50)",
  { group: "Structure" },
  () => {
    const tokens = tokenizer(generateNestedObject(50));
    parser(tokens);
  },
);

Deno.bench("Parse large array (100 items)", { group: "Structure" }, () => {
  const tokens = tokenizer(generateLargeArray(100));
  parser(tokens);
});

Deno.bench("Parse large array (1000 items)", { group: "Structure" }, () => {
  const tokens = tokenizer(generateLargeArray(1000));
  parser(tokens);
});

Deno.bench("Parse mixed types array", { group: "Mixed Content" }, () => {
  const tokens = tokenizer('[1,"string",true,null,{},[],{"key":"value"}]');
  parser(tokens);
});

Deno.bench("Parse complex nested structure", { group: "Mixed Content" }, () => {
  const complex = {
    string: "value",
    number: 123.456,
    boolean: true,
    null: null,
    array: [1, "2", false, null, { nested: "object" }],
    object: {
      key1: "value1",
      key2: 2,
      key3: { nested: [1, 2, 3] },
    },
  };
  const tokens = tokenizer(JSON.stringify(complex));
  parser(tokens);
});

Deno.bench("Parse whitespace heavy JSON", { group: "Edge Cases" }, () => {
  const tokens = tokenizer(`{
    "key1"     :    "value1"   ,
    "key2"     :      {
        "nested"    :    "value2"
    }     ,
    "key3"     :     [    1   ,    2    ,    3    ]
  }`);
  parser(tokens);
});

Deno.bench("Parse minimal whitespace JSON", { group: "Edge Cases" }, () => {
  const tokens = tokenizer('{"k":"v","a":[1,2,3],"o":{"k":"v"}}');
  parser(tokens);
});

Deno.bench("Full pipeline - small JSON", { group: "Full Pipeline" }, () => {
  const input = '{"key":"value"}';
  const tokens = tokenizer(input);
  parser(tokens);
});

Deno.bench("Full pipeline - medium JSON", { group: "Full Pipeline" }, () => {
  const tokens = tokenizer(generateLargeArray(100));
  parser(tokens);
});

Deno.bench("Full pipeline - large JSON", { group: "Full Pipeline" }, () => {
  const tokens = tokenizer(generateLargeArray(1000));
  parser(tokens);
});

Deno.bench("Memory usage - large array", { group: "Memory" }, () => {
  const input = generateLargeArray(10000);
  const tokens = tokenizer(input);
  parser(tokens);
});

Deno.bench("Memory usage - deep nesting", { group: "Memory" }, () => {
  const input = generateNestedObject(100);
  const tokens = tokenizer(input);
  parser(tokens);
});
