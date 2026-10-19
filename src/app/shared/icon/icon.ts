import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'activity'
  | 'alert-circle'
  | 'arrow-right'
  | 'bell'
  | 'book-open'
  | 'building'
  | 'chart'
  | 'check'
  | 'chevron-down'
  | 'clock'
  | 'credit-card'
  | 'database'
  | 'eye'
  | 'eye-off'
  | 'file-plus'
  | 'file-text'
  | 'globe'
  | 'grid'
  | 'help-circle'
  | 'layers'
  | 'list'
  | 'lock'
  | 'log-out'
  | 'mail'
  | 'menu'
  | 'palette'
  | 'panel-left'
  | 'plus'
  | 'rotate-cw'
  | 'search'
  | 'server'
  | 'settings'
  | 'shield'
  | 'target'
  | 'user-plus'
  | 'users'
  | 'x';

@Component({
  selector: 'app-icon',
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    @switch (name()) {
      @case ('activity') {
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      }
      @case ('alert-circle') {
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4.5" />
        <path d="M12 16h.01" />
      }
      @case ('arrow-right') {
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      }
      @case ('bell') {
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      }
      @case ('book-open') {
        <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
        <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
      }
      @case ('building') {
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" />
        <path d="M16 6h.01" />
        <path d="M8 10h.01" />
        <path d="M16 10h.01" />
        <path d="M8 14h.01" />
        <path d="M16 14h.01" />
      }
      @case ('chart') {
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M8 17v-3" />
        <path d="M13 17V5" />
        <path d="M18 17V9" />
      }
      @case ('check') {
        <path d="M20 6 9 17l-5-5" />
      }
      @case ('chevron-down') {
        <path d="m6 9 6 6 6-6" />
      }
      @case ('clock') {
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      }
      @case ('credit-card') {
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      }
      @case ('database') {
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
        <path d="M3 12a9 3 0 0 0 18 0" />
      }
      @case ('eye') {
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      }
      @case ('eye-off') {
        <path d="m3 3 18 18" />
        <path d="M10.6 5.7A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.6 17.6 0 0 1-3.3 4.2" />
        <path d="M6.6 6.9A17.3 17.3 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.7" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      }
      @case ('file-plus') {
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M12 12v6" />
        <path d="M9 15h6" />
      }
      @case ('file-text') {
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      }
      @case ('globe') {
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      }
      @case ('grid') {
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      }
      @case ('help-circle') {
        <circle cx="12" cy="12" r="9" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      }
      @case ('layers') {
        <path d="m12 2 9 5-9 5-9-5z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      }
      @case ('list') {
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      }
      @case ('lock') {
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      }
      @case ('log-out') {
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      }
      @case ('mail') {
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      }
      @case ('menu') {
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      }
      @case ('palette') {
        <circle cx="13.5" cy="6.5" r=".5" />
        <circle cx="17.5" cy="10.5" r=".5" />
        <circle cx="8.5" cy="7.5" r=".5" />
        <circle cx="6.5" cy="12.5" r=".5" />
        <path
          d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
        />
      }
      @case ('panel-left') {
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
      }
      @case ('plus') {
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      }
      @case ('rotate-cw') {
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      }
      @case ('search') {
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      }
      @case ('server') {
        <rect x="2" y="3" width="20" height="8" rx="2" />
        <rect x="2" y="13" width="20" height="8" rx="2" />
        <path d="M6 7h.01" />
        <path d="M6 17h.01" />
      }
      @case ('settings') {
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      }
      @case ('shield') {
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      }
      @case ('target') {
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      }
      @case ('user-plus') {
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      }
      @case ('users') {
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      }
      @case ('x') {
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      }
    }
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      font-size: 1rem;
    }

    svg {
      width: 1.15em;
      height: 1.15em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input.required<IconName>();
}
