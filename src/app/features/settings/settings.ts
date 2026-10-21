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
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import type { ApiError } from '../../core/api/api-error.interceptor';
import { AuthService } from '../../core/auth/auth.service';
import { roleLabel as toRoleLabel } from '../../core/auth/session.utils';
import { requiredValidator } from '../../shared/forms/validators';
import { Icon } from '../../shared/icon/icon';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly user = this.auth.user;
  protected readonly passwordExpired = this.auth.passwordExpired;
  protected readonly canViewSchool = computed(() => this.auth.can('settings.view'));
  protected readonly role = computed(() => toRoleLabel(this.user()?.role, 'Member'));

  protected readonly showPasswords = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly form = new FormGroup({
    currentPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredValidator,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH),
      ],
    }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        requiredValidator,
        Validators.minLength(PASSWORD_MIN_LENGTH),
        Validators.maxLength(PASSWORD_MAX_LENGTH),
      ],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
  });

  protected togglePasswords(): void {
    this.showPasswords.update((visible) => !visible);
  }

  protected isInvalid(field: PasswordField): boolean {
    const control = this.form.controls[field];

    return control.invalid && (control.touched || control.dirty);
  }

  protected errorFor(field: PasswordField): string | null {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      if (field === 'currentPassword') {
        return 'Enter your current password.';
      }

      return field === 'newPassword' ? 'Enter a new password.' : 'Confirm your new password.';
    }

    if (field === 'currentPassword') {
      return `Your current password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    return `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
  }

  protected submit(): void {
    this.formError.set(null);
    this.notice.set(null);

    const { currentPassword, newPassword, confirmPassword } = this.form.controls;

    if (currentPassword.invalid || newPassword.invalid || confirmPassword.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (currentPassword.value === newPassword.value) {
      this.formError.set('New password must be different from your current password.');
      return;
    }

    if (newPassword.value !== confirmPassword.value) {
      this.formError.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);

    this.auth
      .changePassword({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.form.reset();
          this.notice.set('Password updated. Your other sessions have been signed out.');
          void this.router.navigateByUrl('/dashboard');
        },
        error: (error: ApiError) => this.formError.set(error.message),
      });
  }
}
