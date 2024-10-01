import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface Service{
  _id?: string;
  code: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfesionalServiceService {

  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getProfesionalServices(): Observable<Service[]> {
    return this.http.get<any>(`${this.backend}/service`);
  }

  addService(service: Service): Observable<any>{
    return this.http.post<any>(`${this.backend}/service`, service);
  }

}
