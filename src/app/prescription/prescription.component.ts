import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators,} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {AsyncPipe, CommonModule, NgClass, NgIf} from '@angular/common';
import {InsuranceProviderService} from '../insurance-provider.service';
import {InsuranceProvider} from '../interfaces/insurance-provider';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatInputModule} from '@angular/material/input';
import {MatLabel, MatOption} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import {emailMatchValidator} from './email.validator';
import {MatAutocomplete, MatAutocompleteTrigger,} from '@angular/material/autocomplete';
import {MatButtonModule} from '@angular/material/button';
import {convertToBase64} from '../helpers/base64.converter';
import * as openpgp from 'openpgp';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {map, Observable, startWith} from 'rxjs';

@Component({
  selector: 'app-prescription',
  templateUrl: './prescription.component.html',
  styleUrls: ['./prescription.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    TranslatePipe,
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
      .subscribe(
        (insuranceProviders) => {
          this.insuranceProviders = insuranceProviders;
          this.filteredOptions = this.form.get('insurance')?.valueChanges.pipe(
            startWith(''),
            map(value => this._filter(value || '')),
          );
        },

      );
    this.initializeForm();
  }

  private _filter(value: string): InsuranceProvider[] {
    const filterValue = value.toLowerCase();

    return this.insuranceProviders?.filter(option => option.name.toLowerCase().includes(filterValue)).sort(
      (ip1, ip2) => (ip1.name.localeCompare(ip2.name))
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

  public async submitForm() {
    if (!this.form.valid) {
      this.form.markAsDirty();
      return;
    }

    const prescriptionData = {
      prescriptionImageBase64: await convertToBase64(this.prescriptionFile as File),
      prescriptionName: this.prescriptionFile?.name,
      application: '',
      email: this.form.get('email')?.value?.trim(),
      firstname: this.form.get('firstname')?.value?.trim(),
      lastname: this.form.get('lastname')?.value?.trim(),
      insurance: this.form.get('insurance')?.value,
      uploadedAt: new Date(),
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

    return this.http.post(`http://localhost:3000/prescription`, encryptedFormData).subscribe();
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
}
