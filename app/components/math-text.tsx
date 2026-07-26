import katex from "katex";

type MathSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

function escapedAt(value: string, index: number): boolean {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === "\\"; cursor -= 1) {
    slashes += 1;
  }
  return slashes % 2 === 1;
}

function closingIndex(value: string, delimiter: string, from: number): number {
  for (let cursor = from; cursor <= value.length - delimiter.length; cursor += 1) {
    if (value.startsWith(delimiter, cursor) && !escapedAt(value, cursor)) return cursor;
  }
  return -1;
}

export function parseMathText(value: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let textStart = 0;
  let cursor = 0;

  while (cursor < value.length) {
    if (escapedAt(value, cursor)) {
      cursor += 1;
      continue;
    }
    const opening = value.startsWith("$$", cursor)
      ? { token: "$$", closing: "$$", display: true }
      : value[cursor] === "$"
        ? { token: "$", closing: "$", display: false }
        : value.startsWith("\\[", cursor)
          ? { token: "\\[", closing: "\\]", display: true }
          : value.startsWith("\\(", cursor)
            ? { token: "\\(", closing: "\\)", display: false }
            : null;
    if (!opening) {
      cursor += 1;
      continue;
    }

    const formulaStart = cursor + opening.token.length;
    const formulaEnd = closingIndex(value, opening.closing, formulaStart);
    if (formulaEnd < 0) {
      cursor += opening.token.length;
      continue;
    }
    const formula = value.slice(formulaStart, formulaEnd);
    if (!formula.trim()) {
      cursor = formulaEnd + opening.closing.length;
      continue;
    }
    if (cursor > textStart) {
      segments.push({ kind: "text", value: value.slice(textStart, cursor) });
    }
    segments.push({ kind: "math", value: formula, display: opening.display });
    cursor = formulaEnd + opening.closing.length;
    textStart = cursor;
  }

  if (textStart < value.length) {
    segments.push({ kind: "text", value: value.slice(textStart) });
  }
  return segments.length ? segments : [{ kind: "text", value }];
}

export function MathText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`math-text ${className}`.trim()}>
      {parseMathText(text).map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={`text-${index}`}>{segment.value.replaceAll("\\$", "$")}</span>;
        }
        const html = katex.renderToString(segment.value, {
          displayMode: segment.display,
          output: "htmlAndMathml",
          throwOnError: false,
          trust: false,
          strict: "error",
        });
        return (
          <span
            key={`math-${index}`}
            className={segment.display ? "math-display" : "math-inline"}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}
