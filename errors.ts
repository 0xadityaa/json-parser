export class JSONParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public snippet?: string,
  ) {
    super(
      `JSON Parse Error at line ${line}, column ${column}: ${message}${
        snippet ? `\nNear: ${snippet}` : ""
      }`,
    );
    this.name = "JSONParseError";
  }
}

export class TokenizerError extends JSONParseError {
  constructor(message: string, line: number, column: number, snippet?: string) {
    super(message, line, column, snippet);
    this.name = "TokenizerError";
  }
}

export class ParserError extends JSONParseError {
  constructor(message: string, line: number, column: number, snippet?: string) {
    super(message, line, column, snippet);
    this.name = "ParserError";
  }
}
