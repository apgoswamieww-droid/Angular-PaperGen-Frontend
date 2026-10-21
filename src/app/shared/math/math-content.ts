import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { renderMathHtml } from './math-text';

@Component({
  selector: 'app-math-content',
  template: '<span class="math-content" [innerHTML]="html()"></span>',
  styles: [
    `
      :host {
        display: inline;
        font-family: 'KaTeX_Main', Cambria, 'Noto Sans Gujarati', Shruti, 'Times New Roman', serif;
        font-weight: 400;
      }

      .math-content {
        overflow-wrap: anywhere;
      }

      :host ::ng-deep .pg-gujarati {
        font-family: 'Noto Sans Gujarati', 'Nirmala UI', Shruti, sans-serif;
        font-size: 0.92em;
      }

      :host ::ng-deep .katex {
        font-size: 1em;
      }

      :host ::ng-deep .katex-mathml {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        clip-path: inset(50%) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }

      :host ::ng-deep .katex-display {
        margin: 0.5em 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MathContent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly content = input.required<string>();

  protected readonly html = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(renderMathHtml(this.content())),
  );
}
