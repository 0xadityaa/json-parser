import { Position, Token } from "./types.ts";
import { TokenizerError } from "./errors.ts";
import { isBooleanFalse, isBooleanTrue, isNull } from "./utils.ts";

interface TokenizerState {
  input: string;
  position: number;
  line: number;
  column: number;
}

export const tokenizer = (input: string): Token[] => {
  const state: TokenizerState = {
    input,
    position: 0,
    line: 1,
    column: 1,
  };

  const tokens: Token[] = [];

  const getPosition = (): Position => ({
    line: state.line,
    column: state.column,
  });

  const advance = (count = 1): void => {
    for (let i = 0; i < count; i++) {
      if (state.input[state.position] === "\n") {
        state.line++;
        state.column = 1;
      } else {
        state.column++;
      }
      state.position++;
    }
  };

  const peek = (offset = 0): string =>
    state.position + offset < state.input.length
      ? state.input[state.position + offset]
      : "";

  const getSnippet = (length = 10): string => {
    return state.input
      .slice(state.position, state.position + length)
      .replace(/\n/g, "\\n");
  };

  const createToken = (
    type: Token["type"],
    value: string,
    startPos: Position,
  ): Token => ({
    type,
    value,
    line: startPos.line,
    column: startPos.column,
  });

  const throwError = (message: string): never => {
    throw new TokenizerError(
      message,
      state.line,
      state.column,
      getSnippet(),
    );
  };

  while (state.position < input.length) {
    const char = peek();
    const startPos = getPosition();

    // Handle whitespace
    if (/\s/.test(char)) {
      advance();
      continue;
    }

    // Handle structural characters
    switch (char) {
      case "{":
        tokens.push(createToken("BraceOpen", "{", startPos));
        advance();
        continue;
      case "}":
        tokens.push(createToken("BraceClose", "}", startPos));
        advance();
        continue;
      case "[":
        tokens.push(createToken("BracketOpen", "[", startPos));
        advance();
        continue;
      case "]":
        tokens.push(createToken("BracketClose", "]", startPos));
        advance();
        continue;
      case ":":
        tokens.push(createToken("Colon", ":", startPos));
        advance();
        continue;
      case ",":
        tokens.push(createToken("Comma", ",", startPos));
        advance();
        continue;
    }

    // Handle strings
    if (char === '"') {
      let value = "";
      advance(); // Skip opening quote

      while (state.position < input.length) {
        const current = peek();

        if (current === '"' && peek(-1) !== "\\") {
          advance();
          break;
        }

        if (current === "\\") {
          advance();
          const escaped = peek();
          switch (escaped) {
            case '"':
            case "\\":
            case "/":
              value += escaped;
              break;
            case "b":
              value += "\b";
              break;
            case "f":
              value += "\f";
              break;
            case "n":
              value += "\n";
              break;
            case "r":
              value += "\r";
              break;
            case "t":
              value += "\t";
              break;
            case "u": {
              advance();
              const hexCode = input.slice(
                state.position,
                state.position + 4,
              );
              if (!/^[0-9a-fA-F]{4}$/.test(hexCode)) {
                throwError("Invalid unicode escape sequence");
              }
              value += String.fromCharCode(parseInt(hexCode, 16));
              advance(3); // Already advanced one, need three more
              break;
            }
            default:
              throwError(`Invalid escape sequence: \\${escaped}`);
          }
        } else if (current.charCodeAt(0) <= 0x1F) {
          throwError("Unescaped control character in string");
        } else {
          value += current;
        }
        advance();
      }

      if (state.position >= input.length) {
        throwError("Unterminated string");
      }

      tokens.push(createToken("String", value, startPos));
      continue;
    }

    // Handle numbers
    if (char === "-" || /[0-9]/.test(char)) {
      let value = "";

      // Handle negative sign
      if (char === "-") {
        value += char;
        advance();
        if (!/[0-9]/.test(peek())) {
          throwError("Invalid number format: digit expected after minus sign");
        }
      }

      // Handle integer part
      if (peek() === "0") {
        value += peek();
        advance();
        if (/[0-9]/.test(peek())) {
          throwError("Leading zeros not allowed");
        }
      } else {
        while (/[0-9]/.test(peek())) {
          value += peek();
          advance();
        }
      }

      // Handle fraction part
      if (peek() === ".") {
        value += ".";
        advance();
        if (!/[0-9]/.test(peek())) {
          throwError("Invalid fraction format");
        }
        while (/[0-9]/.test(peek())) {
          value += peek();
          advance();
        }
      }

      // Handle exponent part
      if (peek() === "e" || peek() === "E") {
        value += peek();
        advance();
        if (peek() === "+" || peek() === "-") {
          value += peek();
          advance();
        }
        if (!/[0-9]/.test(peek())) {
          throwError("Invalid exponent format");
        }
        while (/[0-9]/.test(peek())) {
          value += peek();
          advance();
        }
      }

      tokens.push(createToken("Number", value, startPos));
      continue;
    }

    // Handle literals (true, false, null)
    if (/[a-z]/.test(char)) {
      let value = "";
      while (/[a-z]/.test(peek())) {
        value += peek();
        advance();
      }

      if (isBooleanTrue(value)) {
        tokens.push(createToken("True", value, startPos));
      } else if (isBooleanFalse(value)) {
        tokens.push(createToken("False", value, startPos));
      } else if (isNull(value)) {
        tokens.push(createToken("Null", value, startPos));
      } else {
        throwError(`Unexpected value: ${value}`);
      }
      continue;
    }

    throwError(`Unexpected character: ${char}`);
  }

  return tokens;
};
