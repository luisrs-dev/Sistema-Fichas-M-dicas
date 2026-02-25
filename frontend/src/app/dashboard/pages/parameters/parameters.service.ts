import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EnvironmentConfig, Parameter, ParameterValue } from './interfaces/parameter.interface';

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


  getParameters<T = Parameter>(parameter: ParameterValue): Observable<T[]> {
    return this.http.get<T[]>(`${this.backend}/parameter/${parameter}`)
    .pipe(
      tap((items) => {
        if (parameter === ParameterValue.Program) {
          this._programs.next(items as unknown as Parameter[]);
        }
      })
    );
  }

  addParameter<T>(parameter: ParameterValue, value: T): Observable<T>{
    return this.http.post<T>(`${this.backend}/parameter/${parameter}`, value);
  }

  getEnvironmentConfigs(): Observable<EnvironmentConfig[]> {
    return this.getParameters<EnvironmentConfig>(ParameterValue.Environment);
  }

  upsertEnvironmentConfig(config: EnvironmentConfig): Observable<EnvironmentConfig> {
    return this.addParameter<EnvironmentConfig>(ParameterValue.Environment, config);
  }

}
