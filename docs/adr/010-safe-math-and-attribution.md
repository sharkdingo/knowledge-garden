# ADR 010: Render safe math and model attribution explicitly

## Status

Accepted.

## Context

Algorithm explanations need readable formulas, but storing generated HTML would
couple content to one renderer and create an unsafe authoring boundary.
Likewise, a plain link list cannot explain which approach borrowed which idea
or preserve enough source metadata for responsible attribution.

Language implementations also existed below approach-specific tabs, so readers
could not tell from the solution overview whether a C++, Java, Python, or
TypeScript implementation was available.

## Decision

- Keep explanation and complexity fields as plain persisted text with `$...$`,
  `$$...$$`, `\(...\)`, and `\[...\]` delimiters.
- Parse delimiters in one presentation component and render formulas with
  KaTeX on the server.
- Request HTML plus MathML output, disable trusted commands, avoid persistent
  macros, and preserve malformed or unmatched input as readable text.
- Store references as aggregate children with title, author, HTTP(S) URL,
  access date, note, and optional solution scope.
- Validate attribution at the application boundary and update references in
  the same D1 batch as solutions and code blocks.
- Derive the public solution-by-language matrix from code-block relationships;
  never maintain a second language list.
- Persist platform presets, language presets, and authoring guidance in the site
  profile so LeetCode can be the default without becoming a UI constant.

## Consequences

Content remains portable, searchable, and renderer-independent in D1. Readers
receive accessible mathematical output without granting formulas HTML
privileges, and source relationships remain auditable. Adding another judge or
language is a configuration change. The extra reference table and validation
rules slightly increase aggregate write complexity, but the repository keeps
that complexity behind the existing domain port.
