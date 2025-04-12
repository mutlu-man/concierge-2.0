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
import { MatLabel, MatOption, MatSelect } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    TranslatePipe,
    NgIf,
    NgClass,
    NgForOf,
    MatIcon,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    MatOption,
    MatCheckbox,
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
    this.form = this.formBuilder.group({
      image: this.formBuilder.control( ['', Validators.required]),
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
      insurance: this.formBuilder.control<InsuranceProvider | ''>(
        {
          value: '',
          disabled: false,
        },
        [Validators.required, Validators.minLength(1)],
      ),
      acceptAGBandDSE: this.formBuilder.control(false, Validators.requiredTrue),
      acceptPersonalDataProcessing: this.formBuilder.control(
        false,
        Validators.requiredTrue,
      ),
      acceptExclusionCriteria: this.formBuilder.control(
        false,
        Validators.requiredTrue,
      ),
    });
  }

  submitForm(): void {
    if (this.form.valid) {
      this.uploading = true;
    }
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
        this.form.controls['image'].setValue(file);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.previewUrl = '';
    this.form.controls['image'].reset();
  }
}
