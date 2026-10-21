import { mathTextFromHtml } from './mathml-paste';

describe('MathML paste conversion', () => {
  it('ignores HTML without MathML', async () => {
    await expect(mathTextFromHtml('<p>Plain text</p>')).resolves.toBeNull();
  });

  it('converts copied MathML equations to LaTeX', async () => {
    const text = await mathTextFromHtml(
      '<p>Solve <math><msup><mi>x</mi><mn>2</mn></msup><mo>=</mo><mn>4</mn></math>.</p>',
    );

    expect(text).toContain('Solve');
    expect(text).toContain('$');
    expect(text).toContain('x');
  });

  it('converts MathType display MathML and ignores its MTEF annotation', async () => {
    const text = await mathTextFromHtml(
      '<math display="block"><semantics><mrow><mfrac><mi>a</mi><mi>b</mi></mfrac></mrow><annotation encoding="MathType-MTEF">MathType@MTEF@5@5@+=binary</annotation></semantics></math>',
    );

    expect(text).toContain('$$');
    expect(text).toContain('\\frac{a}{b}');
    expect(text).not.toContain('MathType@MTEF');
  });

  it('accepts MathType MathML pasted as plain text source', async () => {
    const text = await mathTextFromHtml('<math display="block"><msqrt><mi>x</mi></msqrt></math>');

    expect(text).toContain('$$');
    expect(text).toContain('\\sqrt{x}');
  });
});
