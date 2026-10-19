import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import type { ApiError } from '../../../core/api/api-error.interceptor';
import { AuthService } from '../../../core/auth/auth.service';
import { emailValidator, requiredValidator } from '../../../shared/forms/validators';

const PASSWORD_MIN_LENGTH = 8;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
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
    remember: new FormControl(false, { nonNullable: true }),
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
      .login(this.form.getRawValue())
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/dashboard'),
        error: (error: ApiError) => this.formError.set(error.message),
      });
  }
}
