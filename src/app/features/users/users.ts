import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  type OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, of, Subject } from 'rxjs';
import type { RoleOption } from '../../core/api/roles.types';
import { RolesService } from '../../core/api/roles.service';
import { SchoolUsersService } from '../../core/api/school-users.service';
import type {
  GeneratedCredentials,
  SchoolUserRecord,
  SchoolUsersPage,
  SchoolUserSortDirection,
  SchoolUserSortField,
  SchoolUserStatus,
} from '../../core/api/school-users.types';
import { AuthService } from '../../core/auth/auth.service';
import { roleLabel as toRoleLabel } from '../../core/auth/session.utils';
import { Icon } from '../../shared/icon/icon';

type RoleFilter = string;
type StatusFilter = SchoolUserStatus | 'all';

const FALLBACK_ROLES: RoleOption[] = [
  { key: 'school_admin', name: 'School admin', isSystem: true },
  { key: 'teacher', name: 'Teacher', isSystem: true },
  { key: 'staff', name: 'Staff', isSystem: true },
  { key: 'student', name: 'Student', isSystem: true },
];

@Component({
  selector: 'app-users',
  imports: [RouterLink, Icon],
  templateUrl: './users.html',
  styleUrl: './users.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users implements OnInit {
  private readonly schoolUsers = inject(SchoolUsersService);
  private readonly rolesApi = inject(RolesService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly role = input<string>();
  readonly pageTitle = input<string>();
  readonly pagePath = input<string>('/users');

  private readonly searchInput = new Subject<string>();

  protected readonly query = signal('');
  protected readonly roleFilter = signal<RoleFilter>('all');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly sort = signal<SchoolUserSortField>('createdAt');
  protected readonly dir = signal<SchoolUserSortDirection>('desc');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<GeneratedCredentials | null>(null);
  protected readonly copied = signal(false);
  protected readonly busyId = signal<string | null>(null);
  protected readonly confirmId = signal<string | null>(null);
  protected readonly result = signal<SchoolUsersPage | null>(null);
  protected readonly saved = signal(this.route.snapshot.queryParamMap.get('saved') === '1');
  protected readonly roleOptions = signal<RoleOption[]>(FALLBACK_ROLES);

  protected readonly rows = computed(() => this.result()?.items ?? []);
  protected readonly summary = computed(() => this.result()?.summary ?? null);
  protected readonly total = computed(() => this.result()?.total ?? 0);
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly rangeEnd = computed(() =>
    Math.min(this.page() * this.pageSize(), this.total()),
  );
  protected readonly meId = computed(() => this.auth.user()?.id ?? null);
  protected readonly canManage = computed(() => this.auth.can('users.manage'));
  protected readonly scoped = computed(() => {
    const role = this.role();

    return role !== undefined && role !== '';
  });
  protected readonly studentScope = computed(() => this.role() === 'student');
  protected readonly heading = computed(() => this.pageTitle() ?? 'Users & Roles');
  protected readonly subtitle = computed(() => {
    const role = this.role();

    return role === undefined || role === ''
      ? 'Manage who can sign in to your school panel and what they can access.'
      : `Review and manage ${this.roleLabel(role).toLowerCase()} accounts in your school.`;
  });
  protected readonly addLabel = computed(() => {
    const role = this.role();

    return role === undefined || role === ''
      ? 'Add user'
      : `Add ${this.roleLabel(role).toLowerCase()}`;
  });
  protected readonly addUserQuery = computed<Record<string, string>>(() => {
    const role = this.role();
    const query: Record<string, string> = {};

    if (role !== undefined && role !== '') {
      query['role'] = role;
      query['from'] = this.pagePath();
    }

    return query;
  });
  protected readonly roles = computed<RoleFilter[]>(() => [
    'all',
    ...this.roleOptions().map((role) => role.key),
  ]);

  protected readonly statuses: StatusFilter[] = ['all', 'active', 'suspended'];
  protected readonly pageSizes = [10, 25, 50];

  ngOnInit(): void {
    this.loadRoleOptions();
    this.load();
  }

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.page.set(1);
        this.load();
      });
  }

  protected loadRoleOptions(): void {
    this.rolesApi
      .options()
      .pipe(
        catchError(() => of<RoleOption[]>([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((roles) => {
        if (roles.length > 0) {
          this.roleOptions.set(roles);
        }
      });
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    const scopedRole = this.role();
    const role = scopedRole === undefined || scopedRole === '' ? this.roleFilter() : scopedRole;
    const status = this.statusFilter();

    this.schoolUsers
      .list({
        search: this.query().trim(),
        role: role === 'all' ? '' : role,
        status: status === 'all' ? '' : status,
        page: this.page(),
        pageSize: this.pageSize(),
        sort: this.sort(),
        dir: this.dir(),
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.result.set(result),
        error: (error: unknown) => this.error.set(this.messageOf(error)),
      });
  }

  protected onSearch(value: string): void {
    this.searchInput.next(value);
  }

  protected setRole(value: string): void {
    this.roleFilter.set(value as RoleFilter);
    this.page.set(1);
    this.load();
  }

  protected setStatus(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.load();
  }

  protected sortBy(field: SchoolUserSortField): void {
    if (this.sort() === field) {
      this.dir.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sort.set(field);
      this.dir.set(field === 'name' ? 'asc' : 'desc');
    }

    this.page.set(1);
    this.load();
  }

  protected setPageSize(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.pageCount() || page === this.page()) {
      return;
    }

    this.page.set(page);
    this.load();
  }

  protected toggleStatus(user: SchoolUserRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    const next: SchoolUserStatus = user.status === 'active' ? 'suspended' : 'active';

    this.busyId.set(user.id);
    this.actionError.set(null);
    this.confirmId.set(null);

    this.schoolUsers
      .updateStatus(user.id, next)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.load(true),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected resetPassword(user: SchoolUserRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.busyId.set(user.id);
    this.actionError.set(null);
    this.notice.set(null);
    this.copied.set(false);
    this.confirmId.set(null);

    this.schoolUsers
      .resetPassword(user.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.notice.set(result),
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(user: SchoolUserRecord): void {
    if (this.busyId() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmId.set(user.id);
  }

  protected cancelDelete(): void {
    this.confirmId.set(null);
  }

  protected confirmDelete(user: SchoolUserRecord): void {
    this.busyId.set(user.id);
    this.actionError.set(null);

    this.schoolUsers
      .remove(user.id)
      .pipe(
        finalize(() => this.busyId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmId.set(null);

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected dismissSaved(): void {
    this.saved.set(false);
  }

  protected copyPassword(): void {
    const notice = this.notice();

    if (notice === null) {
      return;
    }

    try {
      void navigator.clipboard?.writeText(notice.password);
    } catch {
      // Clipboard access can be denied; the password stays visible below.
    }

    this.copied.set(true);
  }

  protected isSelf(user: SchoolUserRecord): boolean {
    return user.id === this.meId();
  }

  protected roleLabel(role: RoleFilter): string {
    if (role === 'all') {
      return 'All roles';
    }

    const option = this.roleOptions().find((item) => item.key === role);

    return option?.name ?? toRoleLabel(role, role);
  }

  protected idLabel(value: string | null): string {
    if (value === null) {
      return 'Never';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
