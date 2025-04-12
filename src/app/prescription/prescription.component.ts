import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { NgClass, NgIf, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.scss'],
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    TranslateDirective,
    NgIf,
    TitleCasePipe,
    NgClass,
  ],
  standalone: true,
})
export class PrescriptionComponent implements OnInit {
  public form: FormGroup;
  public prescriptionFile: File | undefined;
  public uploading: boolean | undefined;
  public previewUrl: string;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
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
      insurance: this.formBuilder.control<
        { insuranceId: number; name: string } | ''
      >(
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
      wantsToReceiveNewsletter: this.formBuilder.control(false),
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
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.previewUrl = '';
  }
}
