import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Patient } from '../../interfaces/patient.interface';
import { User } from '../../interfaces/user.interface';
import { Parameter } from '../parameters/interfaces/parameter.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.backend}/user`);
  }
  getUserById(id: string):Observable<any>{
    return this.http.get<any>(`${this.backend}/user/${id}`);
  }

  getUsersByProfile(profile:string): Observable<User[]> {
    return this.http.get<any>(`${this.backend}/user/profile/${profile}`);
  }

  addUser(user: User, permissions: string[], programs: string[]): Observable<any>{
    return this.http.post<any>(`${this.backend}/auth/register`, {user, permissions, programs})
    .pipe(
      catchError( (error) => {
        console.error('Error al agregar el usuario:', error);
        return throwError(() => new Error('Error al agregar el usuario, por favor intente nuevamente.'));
      })
    );
  }

}