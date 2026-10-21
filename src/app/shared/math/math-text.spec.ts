import { plainMathText, renderMathHtml } from './math-text';

describe('math text rendering', () => {
  it('renders inline and display LaTeX with KaTeX', () => {
    const html = renderMathHtml('Solve $x^2$.\n\n$$\\frac{a}{b}$$');

    expect(html).toContain('Solve');
    expect(html).toContain('<br />');
    expect(html.match(/class="katex"/g)?.length).toBe(2);
  });

  it('escapes HTML in plain text', () => {
    expect(renderMathHtml('<script>alert(1)</script>')).not.toContain('<script>');
  });

  it('strips math delimiters for list summaries', () => {
    expect(plainMathText('Find the value of $x^2$ and $$y$$.')).toBe(
      'Find the value of x^2 and y .',
    );
  });

  it('wraps Gujarati runs so their font size can be tuned', () => {
    const gujarati = '\u0AA8\u0A95\u0AB0';

    expect(renderMathHtml(`${gujarati} 3 kg`)).toContain(
      `<span class="pg-gujarati" lang="gu">${gujarati}</span>`,
    );
  });
});
