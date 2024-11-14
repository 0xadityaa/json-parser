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

        if (char === "-") {
            let val = "-";
            char = input[++currLine];
            while (/[\d]/.test(char)) {
                val += char;
                char = input[++currLine];
            }
            tokens.push({ type: "Number", value: val });
            continue;
        }

        if (char === '"') {
            let val = "";
            char = input[++currLine];
            while (char !== '"') {
                if (char === "\\") { // Check for escape character
                    char = input[++currLine]; // Move to the next character
                    if (char === "n") val += "\n"; // Handle newline
                    else if (char === "t") val += "\t"; // Handle tab
                    else if (char === "r") val += "\r"; // Handle carriage return
                    else if (char === "b") val += "\b"; // Handle backspace
                    else if (char === "f") val += "\f"; // Handle form feed
                    else if (char === '"') val += '"'; // Handle escaped double quote
                    else if (char === "\\") val += "\\"; // Handle escaped backslash
                    else val += char; // Handle any other character as is
                } else {
                    val += char; // Normal character
                }
                char = input[++currLine];
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
