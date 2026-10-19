import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { ApiError } from '../../../core/api/api-error.interceptor';
import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { emailValidator, requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLogin {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly year = new Date().getFullYear();
  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, emailValidator],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.minLength(PASSWORD_MIN_LENGTH)],
    }),
  });

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected errorFor(field: 'email' | 'password'): string | null {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      return field === 'email' ? 'Email is required.' : 'Password is required.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.auth
      .login({ ...this.form.getRawValue(), remember: false })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/admin/dashboard'),
        error: (error: ApiError) => this.formError.set(error.message),
      });
  }
}
