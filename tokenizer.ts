import { Token } from "./types.ts";
import { isBooleanFalse, isBooleanTrue, isNull, isNumber } from "./utils.ts";

export const tokenizer = (input: string): Token[] => {
    let currLine = 0;
    const tokens: Token[] = [];

    while (currLine < input.length) {
        let char = input[currLine];

        if (char === "{") {
            tokens.push({ type: "BraceOpen", value: "{" });
            currLine++;
            continue;
        }

        if (char === "}") {
            tokens.push({ type: "BraceClose", value: "}" });
            currLine++;
            continue;
        }

        if (char === "[") {
            tokens.push({ type: "BracketOpen", value: "[" });
            currLine++;
            continue;
        }

        if (char === "]") {
            tokens.push({ type: "BracketClose", value: "]" });
            currLine++;
            continue;
        }

        if (char === ":") {
            tokens.push({ type: "Colon", value: ":" });
            currLine++;
            continue;
        }

        if (char === ",") {
            tokens.push({ type: "Comma", value: "," });
            currLine++;
            continue;
        }

        // Updated number handling
        if (char === "-" || (char >= "0" && char <= "9")) {
            let val = "";
            if (char === "-") {
                val += char;
                char = input[++currLine];
            }

            if (char === "0") {
                val += char;
                char = input[++currLine];
                if (char >= "0" && char <= "9") {
                    throw new Error("Leading zeros not allowed");
                }
            } else if (char >= "1" && char <= "9") {
                while (char >= "0" && char <= "9") {
                    val += char;
                    char = input[++currLine];
                }
            } else if (char === "-") {
                throw new Error("Invalid number format");
            }

            if (char === ".") {
                val += char;
                char = input[++currLine];
                if (!(char >= "0" && char <= "9")) {
                    throw new Error("Invalid fraction format");
                }
                while (char >= "0" && char <= "9") {
                    val += char;
                    char = input[++currLine];
                }
            }

            if (char === "e" || char === "E") {
                val += char;
                char = input[++currLine];
                if (char === "+" || char === "-") {
                    val += char;
                    char = input[++currLine];
                }
                if (!(char >= "0" && char <= "9")) {
                    throw new Error("Invalid exponent format");
                }
                while (char >= "0" && char <= "9") {
                    val += char;
                    char = input[++currLine];
                }
            }

            tokens.push({ type: "Number", value: val });
            continue;
        }

        if (char === '"') {
            let val = "";
            char = input[++currLine];
            while (
                char !== '"' || (currLine > 0 && input[currLine - 1] === "\\")
            ) {
                if (char === "\\") {
                    char = input[++currLine];
                    switch (char) {
                        case '"':
                        case "\\":
                        case "/": {
                            val += char;
                            break;
                        }
                        case "b": {
                            val += "\b";
                            break;
                        }
                        case "f": {
                            val += "\f";
                            break;
                        }
                        case "n": {
                            val += "\n";
                            break;
                        }
                        case "r": {
                            val += "\r";
                            break;
                        }
                        case "t": {
                            val += "\t";
                            break;
                        }
                        case "u": {
                            const hexCode = input.slice(
                                currLine + 1,
                                currLine + 5,
                            );
                            if (!/^[0-9a-fA-F]{4}$/.test(hexCode)) {
                                throw new Error(
                                    "Invalid unicode escape sequence",
                                );
                            }
                            val += String.fromCharCode(parseInt(hexCode, 16));
                            currLine += 4;
                            break;
                        }
                        default: {
                            throw new Error(
                                `Invalid escape sequence: \\${char}`,
                            );
                        }
                    }
                } else if (char.charCodeAt(0) <= 0x1F) {
                    throw new Error("Unescaped control character in string");
                } else {
                    val += char;
                }
                char = input[++currLine];
                if (currLine >= input.length) {
                    throw new Error("Unterminated string");
                }
            }
            currLine++;
            tokens.push({ type: "String", value: val });
            continue;
        }

        if (/[\d\w]/.test(char)) {
            let val = "";
            while (/[\d\w]/.test(char)) {
                val += char;
                char = input[++currLine];
            }

            if (isNumber(val)) tokens.push({ type: "Number", value: val });
            else if (isBooleanTrue(val)) {
                tokens.push({ type: "True", value: val });
            } else if (isBooleanFalse(val)) {
                tokens.push({ type: "False", value: val });
            } else if (isNull(val)) tokens.push({ type: "Null", value: val });
            else throw new Error(`Unexpected value: ${val}`);
            continue;
        }

        if (/\s/.test(char)) {
            currLine++;
            continue;
        }

        throw new Error(`Unexpected character: ${char}`);
    }
    return tokens;
};
