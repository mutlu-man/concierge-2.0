import { AbstractControl, ValidationErrors } from '@angular/forms';

export function emailMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const email = control.get('email');
  const emailConfirm = control.get('emailConfirm');
  return email && emailConfirm && email.value === emailConfirm.value
    ? null
    : { emailMismatch: true };
}
