import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Parameter, ParameterValue } from './interfaces/parameter.interface';

@Injectable({
  providedIn: 'root'
})

export class ParametersService {

  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getParameters(parameter: ParameterValue): Observable<Parameter[]> {
    return this.http.get<any>(`${this.backend}/parameter/${parameter}`);
  }

  addParameter(parameter: ParameterValue, value: Parameter): Observable<any>{
    return this.http.post<any>(`${this.backend}/parameter/${parameter}`, value);
  }

}
