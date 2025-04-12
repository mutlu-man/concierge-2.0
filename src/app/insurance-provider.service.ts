import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, switchMap } from 'rxjs';
import { parseStringPromise } from 'xml2js';
import JSZip from 'jszip';
import { InsuranceProvider } from './interfaces/insurance-provider';

@Injectable({
  providedIn: 'root',
})
export class InsuranceProviderService {
  private apiUrl = '/Download/KrankenkassenDatei.aspx';

  constructor(private http: HttpClient) {}

  getInsuranceProviders(): Observable<InsuranceProvider[]> {
    return this.http
      .get(this.apiUrl, { responseType: 'arraybuffer' })
      .pipe(switchMap((zipData) => from(this.extractXmlFromZip(zipData))));
  }

  private async extractXmlFromZip(
    zipData: ArrayBuffer,
  ): Promise<InsuranceProvider[]> {
    const result: InsuranceProvider[] = [];

    try {
      const zip = await JSZip.loadAsync(zipData);
      const xmlFileName = Object.keys(zip.files).find((name) =>
        name.endsWith('.xml'),
      );
      if (!xmlFileName) {
        throw new Error('No XML file found in ZIP.');
      }

      const xmlContent = await zip.files[xmlFileName].async('text');
      return this.parseXmlWithXml2js(xmlContent);
    } catch (err) {
      console.error('Error unpacking ZIP file:', err);
      return result;
    }
  }

  private async parseXmlWithXml2js(
    xmlString: string,
  ): Promise<InsuranceProvider[]> {
    const result: InsuranceProvider[] = [];

    try {
      const parsed = await parseStringPromise(xmlString, {
        explicitArray: false,
      });

      const infoList =
        parsed['n1:Kostentraeger_Mappingverzeichnis'][
          'n1:Krankenkasseninformation'
        ];

      const infos = Array.isArray(infoList) ? infoList : [infoList];

      for (const info of infos) {
        const id = info['$']['Nummer'];
        const name = info['bas:Name_des_Kostentraegers'];
        const ikNumber = info['bas:Kostentraegerkennung'];

        if (name && ikNumber) {
          result.push({ id, name, ikNumber });
        }
      }
    } catch (err) {
      console.error('Error parsing XML:', err);
    }

    return result;
  }
}
