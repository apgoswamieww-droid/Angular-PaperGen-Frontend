import { type AbstractControl, Validators } from '@angular/forms';

export function requiredValidator(control: AbstractControl) {
  return Validators.required(control);
}

export function emailValidator(control: AbstractControl) {
  return Validators.email(control);
}
