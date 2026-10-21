import { renderToString } from 'katex';

const MATH_SEGMENT = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^$\n]+?)\$/g;
const GUJARATI_SEGMENT = /([\u0A80-\u0AFF\u0964\u0965]+(?:[ \t]+[\u0A80-\u0AFF\u0964\u0965]+)*)/;

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderMathHtml(value: string): string {
  let html = '';
  let cursor = 0;

  MATH_SEGMENT.lastIndex = 0;

  for (const match of value.matchAll(MATH_SEGMENT)) {
    const index = match.index ?? 0;

    html += textHtml(value.slice(cursor, index));

    const display = match[1] !== undefined || match[2] !== undefined;
    const latex = match[1] ?? match[2] ?? match[3] ?? match[4] ?? '';

    html += mathHtml(latex, display);
    cursor = index + match[0].length;
  }

  return html + textHtml(value.slice(cursor));
}

export function plainMathText(value: string): string {
  return value
    .replace(MATH_SEGMENT, (_match, blockDollar, blockBracket, inlineParen, inlineDollar) => {
      const latex = blockDollar ?? blockBracket ?? inlineParen ?? inlineDollar ?? '';

      return ` ${latex} `;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function mathHtml(latex: string, display: boolean): string {
  try {
    return renderToString(latex.trim(), {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'htmlAndMathml',
    });
  } catch {
    return escapeHtml(latex);
  }
}

function textHtml(value: string): string {
  return value
    .split(GUJARATI_SEGMENT)
    .map((part, index) => {
      const html = escapeHtml(part).replace(/\r?\n/g, '<br />');

      return index % 2 === 1 ? `<span class="pg-gujarati" lang="gu">${html}</span>` : html;
    })
    .join('');
}
