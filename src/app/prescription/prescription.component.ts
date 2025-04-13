import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { NgClass, NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { InsuranceProviderService } from '../insurance-provider.service';
import { InsuranceProvider } from '../interfaces/insurance-provider';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatLabel, MatOption } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { emailMatchValidator } from './email.validator';
import {
  MatAutocomplete,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    TranslatePipe,
    NgIf,
    NgClass,
    NgForOf,
    MatIcon,
    MatFormField,
    MatLabel,
    MatOption,
    MatOption,
    MatCheckbox,
    MatAutocomplete,
    MatAutocompleteTrigger,
  ],
  standalone: true,
})
export class PrescriptionComponent implements OnInit {
  public form: FormGroup;
  public prescriptionFile: File | undefined;
  public uploading: boolean | undefined;
  public previewUrl: string;
  public insuranceProviders: InsuranceProvider[];

  constructor(
    private formBuilder: FormBuilder,
    private insuranceService: InsuranceProviderService,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.insuranceService
      .getInsuranceProviders()
      .subscribe(
        (insuranceProviders) => (this.insuranceProviders = insuranceProviders),
      );
  }

  private initializeForm(): void {
    this.form = this.formBuilder.group(
      {
        image: this.formBuilder.control('', Validators.required),
        firstname: this.formBuilder.control('', Validators.required),
        lastname: this.formBuilder.control('', Validators.required),
        email: this.formBuilder.control('', [
          Validators.required,
          Validators.email,
        ]),
        emailConfirm: this.formBuilder.control('', [
          Validators.required,
          Validators.email,
        ]),
        insurance: this.formBuilder.control<InsuranceProvider | ''>('', [
          Validators.required,
          Validators.minLength(1),
        ]),
      },
      { validators: emailMatchValidator },
    );
  }

  public submitForm(): void {
    if (this.form.valid) {
      this.uploading = true;
    }
  }

  public onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  public removeImage() {
    this.previewUrl = '';
    this.form.get('image')?.setValue(null);
  }
}
