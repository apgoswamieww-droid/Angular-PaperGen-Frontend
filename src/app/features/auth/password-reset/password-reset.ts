import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { ApiError } from '../../../core/api/api-error.interceptor';
import { AuthService } from '../../../core/auth/auth.service';
import { emailValidator, requiredValidator } from '../../../shared/forms/validators';
import { Icon } from '../../../shared/icon/icon';

const PASSWORD_MIN_LENGTH = 8;

type Mode = 'forgot' | 'reset';

@Component({
  selector: 'app-password-reset',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './password-reset.html',
  styleUrls: ['../login/login.css', './password-reset.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordReset {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mode: Mode = this.route.snapshot.data['mode'] === 'reset' ? 'reset' : 'forgot';
  protected readonly token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();
  protected readonly year = new Date().getFullYear();
  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly sent = signal(false);

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, emailValidator],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator, Validators.minLength(PASSWORD_MIN_LENGTH)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [requiredValidator],
    }),
  });

  protected get isReset(): boolean {
    return this.mode === 'reset';
  }

  protected get missingToken(): boolean {
    return this.isReset && this.token.length === 0;
  }

  protected togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected errorFor(field: 'email' | 'password' | 'confirmPassword'): string | null {
    const control = this.form.controls[field];

    if (control.valid || !(control.touched || control.dirty)) {
      return null;
    }

    if (control.hasError('required')) {
      if (field === 'email') {
        return 'Email is required.';
      }

      return field === 'password' ? 'Password is required.' : 'Please confirm your new password.';
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  protected submit(): void {
    this.formError.set(null);

    if (this.isReset) {
      this.submitReset();
      return;
    }

    this.submitForgot();
  }

  private submitForgot(): void {
    const email = this.form.controls.email;

    if (email.invalid) {
      email.markAsTouched();
      return;
    }

    this.submitting.set(true);

    this.auth
      .forgotPassword(email.value)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.sent.set(true),
        error: (error: ApiError) => this.formError.set(error.message),
      });
  }

  private submitReset(): void {
    if (this.missingToken) {
      return;
    }

    const { password, confirmPassword } = this.form.controls;

    if (password.invalid || confirmPassword.invalid) {
      password.markAsTouched();
      confirmPassword.markAsTouched();
      return;
    }

    if (password.value !== confirmPassword.value) {
      this.formError.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);

    this.auth
      .resetPassword({ token: this.token, password: password.value })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.sent.set(true),
        error: (error: ApiError) => this.formError.set(error.message),
      });
  }
}
