import { tokenizer } from './tokenizer.ts';
import { parser } from './parser.ts';

if (import.meta.main) {
  console.log(
  parser(
    tokenizer(`{
  "id": "647ceaf3657eade56f8224eb",
  "index": 0,
  "anArray": [],
  "boolean": true,
  "nullValue": null
}
`)
  )
);

}
