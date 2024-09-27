import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Parameter, ParameterValue } from './interfaces/parameter.interface';

@Injectable({
  providedIn: 'root'
})

export class ParametersService {

  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  private _programs: BehaviorSubject<Parameter[]>;

  constructor(){
    this._programs = new BehaviorSubject<Parameter[]>([]);
  }

  get programs(){
    return this._programs.asObservable();
  }


  getParameters(parameter: ParameterValue): Observable<Parameter[]> {
    return this.http.get<any>(`${this.backend}/parameter/${parameter}`)
    .pipe(
      tap( programs => {
        this._programs.next(programs)
      })
    )
  }

  addParameter(parameter: ParameterValue, value: Parameter): Observable<any>{
    return this.http.post<any>(`${this.backend}/parameter/${parameter}`, value);
  }

}
