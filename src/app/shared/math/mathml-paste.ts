export async function mathTextFromHtml(html: string): Promise<string | null> {
  if (!/<math[\s>]/i.test(html)) {
    return null;
  }

  const document = new DOMParser().parseFromString(html, 'text/html');
  const formulas = Array.from(document.body.querySelectorAll('math'));

  if (formulas.length === 0) {
    return null;
  }

  const { MathMLToLaTeX } = await import('mathml-to-latex');

  for (const formula of formulas) {
    let latex = '';

    try {
      latex = MathMLToLaTeX.convert(formula.outerHTML).trim();
    } catch {
      latex = '';
    }

    formula.replaceWith(
      document.createTextNode(latex === '' ? (formula.textContent ?? '') : `$${latex}$`),
    );
  }

  document.body.querySelectorAll('br').forEach((element) => {
    element.replaceWith(document.createTextNode('\n'));
  });
  document.body
    .querySelectorAll('p, div, li, tr, h1, h2, h3, h4, h5, h6, blockquote')
    .forEach((element) => element.append(document.createTextNode('\n')));

  const text = (document.body.textContent ?? '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text === '' ? null : text;
}
