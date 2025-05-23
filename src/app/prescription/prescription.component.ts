import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { InsuranceProviderService } from '../insurance-provider.service';
import { InsuranceProvider } from '../interfaces/insurance-provider';
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
import { convertToBase64 } from '../helpers/base64.converter';
import * as openpgp from 'openpgp';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable, startWith } from 'rxjs';

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
    MatIcon,
    MatFormField,
    MatLabel,
    MatOption,
    MatOption,
    MatAutocomplete,
    MatAutocompleteTrigger,
    AsyncPipe,
  ],
  standalone: true,
})
export class PrescriptionComponent implements OnInit {
  public form: FormGroup;
  public prescriptionFile: File | undefined;
  public uploading: boolean;
  public previewUrl: string;
  public insuranceProviders: InsuranceProvider[];
  public filteredOptions: Observable<InsuranceProvider[]> | undefined;

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private insuranceService: InsuranceProviderService,
  ) {}

  ngOnInit(): void {
    this.insuranceService
      .getInsuranceProviders()
      .subscribe((insuranceProviders) => {
        this.insuranceProviders = insuranceProviders;
        this.filteredOptions = this.form.get('insurance')?.valueChanges.pipe(
          startWith(''),
          map((value) => this._filter(value)),
        );

      });
    this.initializeForm();
  }

  private _filter(value: string | InsuranceProvider): InsuranceProvider[] {
    if (typeof value === 'string') {
      const filterValue = value.toLowerCase();
      return this.insuranceProviders?.filter((option) =>
        option.name.toLowerCase().includes(filterValue),
      ).sort((a, b) => a.name.localeCompare(b.name)) || [];
    }

    return [value];
  }

  private initializeForm(): void {
    this.form = this.formBuilder.group(
      {
        image: this.formBuilder.control('', Validators.required),
        firstName: this.formBuilder.control('', Validators.required),
        lastName: this.formBuilder.control('', Validators.required),
        email: this.formBuilder.control('', [
          Validators.required,
          Validators.email,
        ]),
        emailConfirm: this.formBuilder.control('', [
          Validators.required,
          Validators.email,
        ]),
        street: this.formBuilder.control('', Validators.required),
        houseNumber: this.formBuilder.control('', Validators.required),
        postalCode: this.formBuilder.control('', Validators.required),
        city: this.formBuilder.control('', Validators.required),
        insurance: this.formBuilder.control<InsuranceProvider | ''>('', [
          Validators.required,
          Validators.minLength(1),
        ]),
      },
      { validators: emailMatchValidator },
    );
  }

  public displayName(option: InsuranceProvider): string {
    return option?.name;
  }

  public async submitForm() {
    if (!this.form.valid) {
      this.form.markAsDirty();
      return;
    }

    const prescriptionData = {
      prescription: await convertToBase64(this.prescriptionFile as File),
      prescriptionName: this.prescriptionFile?.name,
      application: '',
      email: this.form.get('email')?.value?.trim(),
      firstName: this.form.get('firstName')?.value?.trim(),
      surName: this.form.get('lastName')?.value?.trim(),
      street: this.form.get('street')?.value?.trim(),
      houseNumber: this.form.get('houseNumber')?.value?.trim(),
      postalCode: this.form.get('postalCode')?.value?.trim(),
      city: this.form.get('city')?.value?.trim(),
      insurance: this.insuranceProviders.find(ip => ip.id === this.form.get('insurance')?.value?.id)
    };

    const encryptionKey = await openpgp.readKey({
      armoredKey: environment.publicKey,
    });
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({
        text: JSON.stringify(prescriptionData),
      }), // input as Message object
      encryptionKeys: encryptionKey,
    });

    const encryptedFormData = new FormData();
    encryptedFormData.append(
      'prescription',
      new Blob([encrypted], { type: 'application/octet-stream' }),
      this.prescriptionFile?.name,
    );

    return this.http.put(`http://localhost:3000/prescription`, encryptedFormData).subscribe();
  }

  public onFileChange(event: Event) {
    this.prescriptionFile = (event.target as HTMLInputElement).files?.[0];
    if (this.prescriptionFile) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.prescriptionFile);
    }
  }

  public removeImage() {
    this.previewUrl = '';
    this.form.get('image')?.setValue(null);
  }

  public getInsuranceName(insurance: InsuranceProvider | undefined): string {
    return insurance?.name || '';
  }
}
