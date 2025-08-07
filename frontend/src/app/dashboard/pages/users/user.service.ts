import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../../../auth/interfaces/login-response.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.backend}/user`);
  }

  getServicesByProfile(profile: string): Observable<any[]> {
    return this.http.get<any>(`${this.backend}/user/services/${profile}`);
  }
  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${this.backend}/user/${id}`);
  }

  getUsersByProfile(profile: string): Observable<User[]> {
    return this.http.get<any>(`${this.backend}/user/profile/${profile}`);
  }

  createUser(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.backend}/auth/register`, formData).pipe(
      catchError((error) => {
        console.error('Error al agregar el usuario:', error);
        return throwError(() => new Error('Error al agregar el usuario, por favor intente nuevamente.'));
      })
    );
  }

  updateUser(formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.backend}/auth/update`, formData).pipe(
      catchError((error) => {
        console.error('Error al agregar el usuario:', error);
        return throwError(() => new Error('Error al agregar el usuario, por favor intente nuevamente.'));
      })
    );
  }

  updatePassword(data: {id: string, password: string}): Observable<any> {
    return this.http.put<any>(`${this.backend}/auth/update-password`, data).pipe(
      catchError((error) => {
        console.error('Error al actualizar contraseña de usuario:', error);
        return throwError(() => new Error('Error al actualizar contraseña de usuario, por favor intente nuevamente.'));
      })
    );
  };

  update(user: User, permissions: string[], programs: string[]): Observable<any> {
    return this.http.put<any>(`${this.backend}/user`, { user, permissions, programs }).pipe(
      tap(({ user }) => {
        console.log({ userEnTap: user });

        localStorage.setItem('user', JSON.stringify(user));
      }),
      catchError((error) => {
        console.error('Error al actualizar el usuario:', error);
        return throwError(() => new Error('Error al actualizar el usuario, por favor intente nuevamente.'));
      })
    );
  }
}
