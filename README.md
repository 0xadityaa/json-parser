# <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/JSON_vector_logo.svg/160px-JSON_vector_logo.svg.png" alt="json logo" width="50" height="50"> JSON Parser

This project is a simple JSON parser built using **Deno** + **Typescript**. It
includes a tokenizer that breaks down JSON strings into tokens, a parser that
converts those tokens into an Abstract Syntax Tree (AST), and a set of tests to
ensure the parser follows all the grammar for JSON defined in the
[_ECMA-404 The JSON Data Interchange Standard_](https://www.json.org/json-en.html).
You can parse local JSON files as well as the JSON from an api endpoint.

## Project Structure

```
/json-parser
      ├── main.ts          # Entry point for the application
      ├── parser.ts        # Contains the parser logic
      ├── tokenizer.ts     # Contains the tokenizer logic
      ├── types.ts         # Type definitions for tokens and AST nodes
      ├── errors.ts        # Type definitions for parser and tokenizer errors
      └── utils.ts         # Utility functions for type checking
      │
      ├── main_test.ts       # Contains tests for the parser and tokenizer
      ├── main_benchmarks.ts # Contains benchmarking tests for the parser and tokenizer
      └── test-data.json     # Sample JSON data for testing
      │
      ├── deno.json                # Deno configuration file
      ├── .vscode/settings.json    # VSCode settings for Deno
      └── deno.lock                # Deno lock file for dependencies
```

## Components

### 1. Tokenizer

The tokenizer is responsible for breaking down a JSON string into a series of
tokens. Each token represents a meaningful element in the JSON structure, such
as an object, array, string, number, boolean, or null value. The tokenizer reads
the input string character by character and identifies these tokens based on the
JSON syntax.

**Key Functions**

- tokenizer(input: string): Token[]: This function takes a JSON string as input
  and returns an array of tokens. It handles different characters and
  constructs, such as braces, brackets, colons, commas, strings, numbers,
  booleans, and null values.

### 2. Parser

The parser takes the array of tokens produced by the tokenizer and constructs an
Abstract Syntax Tree (AST). The AST is a hierarchical representation of the JSON
structure, which makes it easier to work with the data programmatically.

**Key Functions**

- parser(tokens: Token[]): ASTNode: This function processes the tokens and
  builds the AST. It includes methods to parse values, objects, and arrays,
  handling the different types of tokens appropriately.

## Setup Instructions

To set up the project locally, follow these steps:

1. **Install Deno:** If you haven't already, install Deno by following the
   instructions on the [Deno website](https://deno.land/#installation).
2. **Clone the Repository:** Clone this repository to your local machine using:

```bash
git clone https://github.com/0xadityaa/json-parser.git
cd json-parser
```

3. **Install Dependencies:** The project uses Deno's built-in dependency
   management. You can install the necessary dependencies by running:

```bash
deno install
```

4. **Run Project:** To run the JSON parser, you can either use the local json
   file or parse an api response from url directly as follows:
   - **For viewing all available commands**
     ```bash
     deno run main.ts --help
     ```
   - **For local json file**
     ```bash
     deno run --allow-read main.ts ./path/to/data.json -w
     ```
   - **For api endpoint**
     ```bash
     deno run --allow-net main.ts https://api.example.com/ -w
     ```
   - **For prettify json**
     ```bash
     deno run --allow-read main.ts --pretty ./data.json -w
     ```
     ```bash
     deno run --allow-read main.ts --pretty https://api.example.com/ -w
     ```

## Testing & Benchmarking

### _Running Tests_

To ensure the parser is valid and follows all the grammar for JSON defined in
the _ECMA-404 The JSON Data Interchange Standard_ there are tests defined in
`main_test.ts`. To run this test, run following command:

```bash
deno test --allow-read --allow-net main_test.ts
```

All the tests present in `main_test.ts` should run and pass (ideally 🙃) and
output should look like:

<img width="838" alt="image" src="https://github.com/user-attachments/assets/8c9c6695-2efa-4266-8d99-1b5e4a441a0e" />

### _Test coverage profile_

To generate/check test coverage, run following command:

```bash
deno test --allow-read --allow-net main_test.ts --coverage=cov_profile && deno coverage cov_profile
```

Coverage report will be generated in `cov_profile` directory, and output should
look like this:

<img width="367" alt="errors ts" src="https://github.com/user-attachments/assets/359f25ea-0cfe-432d-9651-f3752f10b001" />

### _Performance benchmarks_

The performance benchmarks are defined in `main_benchmarks.ts`. These benchmarks
are used to measure the performance of all the components parser, tokenizer, API
fetch and file read.

You can run performance benchmarks by running following command:

```bash
deno bench main_benchmarks.ts
```

Benchmarks for all the conditions in `main_benchmarks.ts` should run and you
should see something like:

![image](https://github.com/user-attachments/assets/a714ce54-0b30-4d19-805d-3e07da339725)
