import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrescriptionComponent } from './prescription/prescription.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PrescriptionComponent, TranslateModule],
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'concierge-2.0';

  constructor(private translateService: TranslateService) {
    this.translateService.setDefaultLang('de');
    this.translateService.use('de');
  }
}
