import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfesionalRoleService {

  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getProfesionalRoles(): Observable<any> {
    return this.http.get<any>(`${this.backend}/profesional-role`);
  }

    getProfesionalRoleById(id: string): Observable<any> {
    console.log('url endpoint', `${this.backend}/profesional-role/${id}`);
    
    return this.http.get<any>(`${this.backend}/profesional-role/${id}`);
  }

  add(name: string, services: string[]): Observable<any>{
    return this.http.post<any>(`${this.backend}/profesional-role`, {name, services});
  }

}
