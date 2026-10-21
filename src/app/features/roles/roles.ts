import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import type {
  PermissionDefinition,
  PermissionGroup,
  RoleAuditPage,
  RoleAuditRecord,
  RoleRecord,
  RolesPage,
} from '../../core/api/roles.types';
import { RolesService } from '../../core/api/roles.service';
import { AuthService } from '../../core/auth/auth.service';
import type { Permission } from '../../core/auth/permissions';
import { requiredValidator } from '../../shared/forms/validators';
import { Icon } from '../../shared/icon/icon';

const NAME_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 240;
const AUDIT_PAGE_SIZE = 10;

type FieldName = 'name' | 'description';

@Component({
  selector: 'app-roles',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Roles {
  private readonly rolesApi = inject(RolesService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchInput = new Subject<string>();

  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly busyKey = signal<string | null>(null);
  protected readonly confirmKey = signal<string | null>(null);
  protected readonly result = signal<RolesPage | null>(null);

  protected readonly audit = signal<RoleAuditPage | null>(null);
  protected readonly auditLoading = signal(true);
  protected readonly auditError = signal<string | null>(null);

  protected readonly formOpen = signal(false);
  protected readonly editingRole = signal<RoleRecord | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly selectedPermissions = signal<ReadonlySet<string>>(new Set());

  protected readonly canManage = computed(() => this.auth.can('roles.manage'));
  protected readonly rows = computed(() => this.result()?.items ?? []);
  protected readonly summary = computed(() => this.result()?.summary ?? null);
  protected readonly catalog = computed<PermissionGroup[]>(() => this.result()?.catalog ?? []);
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
  protected readonly auditEntries = computed<RoleAuditRecord[]>(() => this.audit()?.items ?? []);
  protected readonly auditTotal = computed(() => this.audit()?.total ?? 0);
  protected readonly editingSystem = computed(() => this.editingRole()?.isSystem === true);
  protected readonly editingSchoolAdmin = computed(
    () => this.editingRole()?.key === 'school_admin',
  );
  protected readonly selectedCount = computed(() => this.selectedPermissions().size);

  protected readonly pageSizes = [10, 25, 50];

  private readonly permissionIndex = computed(() => {
    const index = new Map<string, PermissionDefinition>();

    for (const group of this.catalog()) {
      for (const permission of group.permissions) {
        index.set(permission.key, permission);
      }
    }

    return index;
  });

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredValidator,
        Validators.minLength(2),
        Validators.maxLength(NAME_MAX_LENGTH),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(DESCRIPTION_MAX_LENGTH)],
    }),
  });

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.query.set(value);
        this.page.set(1);
        this.load();
      });

    this.load();
    this.loadAudit();
  }

  protected load(quiet = false): void {
    if (!quiet) {
      this.loading.set(true);
    }

    this.error.set(null);

    this.rolesApi
      .list({
        search: this.query().trim(),
        page: this.page(),
        pageSize: this.pageSize(),
        sort: 'name',
        dir: 'asc',
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

  protected loadAudit(): void {
    this.auditLoading.set(true);
    this.auditError.set(null);

    this.rolesApi
      .audit({ page: 1, pageSize: AUDIT_PAGE_SIZE })
      .pipe(
        finalize(() => this.auditLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (audit) => this.audit.set(audit),
        error: (error: unknown) => this.auditError.set(this.messageOf(error)),
      });
  }

  protected onSearch(value: string): void {
    this.searchInput.next(value);
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

  protected openCreate(): void {
    this.editingRole.set(null);
    this.form.reset({ name: '', description: '' });
    this.selectedPermissions.set(new Set());
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmKey.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(role: RoleRecord): void {
    this.editingRole.set(role);
    this.form.reset({ name: role.name, description: role.description });
    this.selectedPermissions.set(new Set(role.permissions));
    this.formError.set(null);
    this.actionError.set(null);
    this.notice.set(null);
    this.confirmKey.set(null);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editingRole.set(null);
    this.formError.set(null);
    this.selectedPermissions.set(new Set());
  }

  protected errorFor(field: FieldName): string | null {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (field === 'name' && control.hasError('required')) {
      return 'Role name is required.';
    }

    if (control.hasError('minlength')) {
      return 'Use at least 2 characters.';
    }

    if (field === 'name' && control.hasError('maxlength')) {
      return `Use ${NAME_MAX_LENGTH} characters or fewer.`;
    }

    if (field === 'description' && control.hasError('maxlength')) {
      return `Use ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
    }

    return 'This value is not valid.';
  }

  protected isSelected(permission: Permission): boolean {
    return this.selectedPermissions().has(permission);
  }

  protected togglePermission(permission: Permission, checked: boolean): void {
    const next = new Set(this.selectedPermissions());

    if (checked) {
      next.add(permission);

      if (permission.endsWith('.manage')) {
        next.add(permission.replace(/\.manage$/, '.view') as Permission);
      }
    } else {
      next.delete(permission);

      if (permission.endsWith('.view')) {
        next.delete(permission.replace(/\.view$/, '.manage') as Permission);
      }
    }

    this.selectedPermissions.set(next);
  }

  protected toggleAll(checked: boolean): void {
    if (checked) {
      this.selectedPermissions.set(
        new Set(this.catalog().flatMap((group) => group.permissions.map((item) => item.key))),
      );
      return;
    }

    this.selectedPermissions.set(new Set());
  }

  protected permissionLabel(key: string): string {
    return this.permissionIndex().get(key)?.label ?? key;
  }

  protected visiblePermissions(role: RoleRecord): string[] {
    return role.permissions.slice(0, 4);
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const editing = this.editingRole();
    const payload = {
      name: value.name.trim(),
      description: value.description.trim(),
      permissions: [...this.selectedPermissions()],
    };

    this.saving.set(true);
    this.actionError.set(null);

    const request =
      editing === null
        ? this.rolesApi.create(payload)
        : this.rolesApi.update(editing.key, {
            ...payload,
            name: editing.isSystem ? editing.name : payload.name,
          });

    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const wasEditing = editing !== null;

          this.closeForm();
          this.notice.set(wasEditing ? 'Role updated.' : 'Role created.');
          this.page.set(1);
          this.load(true);
          this.loadAudit();
        },
        error: (error: unknown) => this.formError.set(this.messageOf(error)),
      });
  }

  protected requestDelete(role: RoleRecord): void {
    if (this.busyKey() !== null) {
      return;
    }

    this.actionError.set(null);
    this.notice.set(null);
    this.confirmKey.set(role.key);
  }

  protected cancelDelete(): void {
    this.confirmKey.set(null);
  }

  protected confirmDelete(role: RoleRecord): void {
    this.busyKey.set(role.key);
    this.actionError.set(null);

    this.rolesApi
      .remove(role.key)
      .pipe(
        finalize(() => this.busyKey.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.confirmKey.set(null);
          this.notice.set('Role deleted.');

          if (this.rows().length === 1 && this.page() > 1) {
            this.page.update((page) => page - 1);
          }

          this.load(true);
          this.loadAudit();
        },
        error: (error: unknown) => this.actionError.set(this.messageOf(error)),
      });
  }

  protected dismissNotice(): void {
    this.notice.set(null);
  }

  protected actionLabel(action: RoleAuditRecord['action']): string {
    switch (action) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      default:
        return 'Deleted';
    }
  }

  protected auditChangeLabel(entry: RoleAuditRecord): string {
    if (entry.action !== 'updated' || !entry.before || !entry.after) {
      return '';
    }

    const before = entry.before.permissions.length;
    const after = entry.after.permissions.length;
    const delta = after - before;

    if (delta === 0) {
      return 'Permissions or details changed';
    }

    return `${delta > 0 ? '+' : ''}${delta} permission${Math.abs(delta) === 1 ? '' : 's'}`;
  }

  protected dateLabel(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
  }

  protected dateTimeLabel(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
  }

  private messageOf(error: unknown): string {
    return (error as { message?: string }).message ?? 'Something went wrong. Please try again.';
  }
}
