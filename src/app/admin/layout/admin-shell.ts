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
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { initialsFor, roleLabel as toRoleLabel } from '../../core/auth/session.utils';
import { Icon, type IconName } from '../../shared/icon/icon';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SIDEBAR_STORAGE_KEY = 'pg.admin.sidebar';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly router = inject(Router);
  private readonly auth = inject(AdminAuthService);

  protected readonly year = new Date().getFullYear();
  protected readonly user = this.auth.user;
  protected readonly collapsed = signal(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed');
  protected readonly mobileNavOpen = signal(false);
  protected readonly userMenuOpen = signal(false);

  private readonly userMenuRef = viewChild<ElementRef<HTMLElement>>('userMenu');

  protected readonly displayName = computed(() => this.user()?.name ?? 'Super Admin');
  protected readonly initials = computed(() => initialsFor(this.user()?.name, 'SA'));
  protected readonly roleLabel = computed(() => toRoleLabel(this.user()?.role, 'Super admin'));

  protected readonly navSections: NavSection[] = [
    {
      label: 'Overview',
      items: [{ label: 'Platform overview', path: '/admin/dashboard', icon: 'grid', exact: true }],
    },
    {
      label: 'Tenants',
      items: [
        { label: 'Schools & Institutes', path: '/admin/schools', icon: 'building' },
        { label: 'Branding studio', path: '/admin/white-label', icon: 'palette' },
        { label: 'Plans & Billing', path: '/admin/plans', icon: 'credit-card' },
      ],
    },
    {
      label: 'Platform',
      items: [
        { label: 'Platform Users', path: '/admin/users', icon: 'users' },
        { label: 'Activity Log', path: '/admin/activity', icon: 'activity' },
        { label: 'Platform Settings', path: '/admin/settings', icon: 'settings' },
      ],
    },
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.mobileNavOpen.set(false);
        this.userMenuOpen.set(false);
      });
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
    void this.router.navigateByUrl('/admin/login');
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
