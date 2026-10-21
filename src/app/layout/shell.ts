import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import type { Permission } from '../core/auth/permissions';
import { initialsFor, roleLabel as toRoleLabel } from '../core/auth/session.utils';
import { Icon, type IconName } from '../shared/icon/icon';

interface NavChild {
  label: string;
  path: string;
  exact?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  exact?: boolean;
  children?: NavChild[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SIDEBAR_STORAGE_KEY = 'pg.sidebar';
const SIDEBAR_GROUPS_STORAGE_KEY = 'pg.sidebar.groups';

function readOpenGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);

    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === 'string')
        : [],
    );
  } catch {
    return new Set();
  }
}

function isItemActive(item: NavChild, url: string): boolean {
  if (item.exact === true) {
    return url === item.path;
  }

  return url === item.path || url.startsWith(`${item.path}/`);
}

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly year = new Date().getFullYear();
  protected readonly user = this.auth.user;
  protected readonly collapsed = signal(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed');
  protected readonly mobileNavOpen = signal(false);
  protected readonly userMenuOpen = signal(false);
  private readonly openGroups = signal<ReadonlySet<string>>(readOpenGroups());
  private readonly currentUrl = signal(this.router.url.split(/[?#]/)[0]);

  private readonly userMenuRef = viewChild<ElementRef<HTMLElement>>('userMenu');

  protected readonly displayName = computed(() => this.user()?.name ?? 'Admin');
  protected readonly initials = computed(() => initialsFor(this.user()?.name, 'AD'));
  protected readonly roleLabel = computed(() => toRoleLabel(this.user()?.role, 'Administrator'));

  protected readonly navSections = computed<NavSection[]>(() => {
    const can = (permission: Permission): boolean => this.auth.can(permission);
    const sections: NavSection[] = [
      {
        label: 'Overview',
        items: [{ label: 'Dashboard', path: '/dashboard', icon: 'grid', exact: true }],
      },
      {
        label: 'Manage',
        items: [
          ...(can('users.view')
            ? [
                {
                  label: 'Users',
                  path: '/users',
                  icon: 'user-plus' as const,
                  children: [
                    { label: 'All Users', path: '/users', exact: true },
                    { label: 'Teachers', path: '/users/teachers' },
                    { label: 'Students', path: '/users/students' },
                    { label: 'Staff', path: '/users/staff' },
                  ],
                },
              ]
            : []),
          ...(can('roles.view')
            ? [{ label: 'Roles', path: '/roles', icon: 'shield' as const, exact: true }]
            : []),
        ],
      },
      {
        label: 'Library',
        items: [
          ...(can('questions.view')
            ? [{ label: 'Question Bank', path: '/questions', icon: 'help-circle' as const }]
            : []),
          ...(can('blueprints.view')
            ? [{ label: 'Blueprints', path: '/blueprints', icon: 'layers' as const }]
            : []),
        ],
      },
      {
        label: 'Papers',
        items: [
          ...(can('papers.manage')
            ? [{ label: 'Generate Paper', path: '/papers/generate', icon: 'file-plus' as const }]
            : []),
          ...(can('papers.view')
            ? [{ label: 'My Papers', path: '/papers', icon: 'file-text' as const, exact: true }]
            : []),
        ],
      },
      {
        label: 'Insights',
        items: can('reports.view')
          ? [
              {
                label: 'Reports',
                path: '/reports',
                icon: 'chart' as const,
                children: [{ label: 'Class & Student', path: '/reports/class-students' }],
              },
            ]
          : [],
      },
      {
        label: 'Setup',
        items: can('masters.view')
          ? [
              {
                label: 'Masters',
                path: '/masters',
                icon: 'database' as const,
                children: [
                  { label: 'Mediums', path: '/masters/mediums' },
                  { label: 'Standards', path: '/masters/standards' },
                  { label: 'Subjects', path: '/masters/subjects' },
                  { label: 'Chapters', path: '/masters/chapters' },
                  { label: 'Topics', path: '/masters/topics' },
                  { label: 'Question Types', path: '/masters/question-types' },
                  { label: 'Difficulty Levels', path: '/masters/difficulty-levels' },
                  { label: 'Bloom Levels', path: '/masters/bloom-levels' },
                  { label: 'Exam Types', path: '/masters/exam-types' },
                ],
              },
            ]
          : [],
      },
    ];

    return sections.filter((section) => section.items.length > 0);
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.mobileNavOpen.set(false);
        this.userMenuOpen.set(false);
        this.currentUrl.set(this.router.url.split(/[?#]/)[0]);
        this.syncActiveGroups();
      });

    this.syncActiveGroups();
  }

  protected isGroupOpen(item: NavItem): boolean {
    return this.openGroups().has(item.path);
  }

  protected isGroupActive(item: NavItem): boolean {
    return item.children?.some((child) => isItemActive(child, this.currentUrl())) ?? false;
  }

  protected onGroupClick(item: NavItem): void {
    const next = new Set(this.openGroups());

    if (next.has(item.path)) {
      next.delete(item.path);
    } else {
      next.add(item.path);
    }

    this.setOpenGroups(next);
  }

  private syncActiveGroups(): void {
    const url = this.router.url.split(/[?#]/)[0];
    const next = new Set(this.openGroups());
    let changed = false;

    for (const section of this.navSections()) {
      for (const item of section.items) {
        const children = item.children;

        if (children === undefined || next.has(item.path)) {
          continue;
        }

        if (children.some((child) => isItemActive(child, url))) {
          next.add(item.path);
          changed = true;
        }
      }
    }

    if (changed) {
      this.setOpenGroups(next);
    }
  }

  private setOpenGroups(groups: Set<string>): void {
    this.openGroups.set(groups);
    localStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify([...groups]));
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? 'expanded' : 'collapsed');
      return !value;
    });
  }

  protected toggleMobileNav(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  protected closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  protected logout(): void {
    this.closeUserMenu();
    this.auth.logout().subscribe();
    void this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (!this.userMenuOpen()) {
      return;
    }

    const target = event.target as Node | null;
    const menu = this.userMenuRef()?.nativeElement;

    if (menu !== undefined && target !== null && menu.contains(target)) {
      return;
    }

    this.userMenuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.userMenuOpen.set(false);
  }
}
