import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { User } from './interfaces/user.interface';
import { AuthStatus } from './interfaces/auth-status.enum';
import { LoginResponse } from './interfaces/login-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl: string = environment.baseUrl;
  private router = inject(Router);

  private _currentUser = signal<User | null>(null);
  private _authStatus = signal<AuthStatus>(AuthStatus.checking);
  private isAuthenticated: boolean = false;

  private http = inject(HttpClient);

  login(email: string, password: string): Observable<boolean> {
    const url = `${this.baseUrl}/auth/login`;
    const body = { email, password };

    return this.http.post<LoginResponse>(url, body).pipe(
      tap(({ user, token, expiresIn }) => {


        if (!token) {
          throw new Error('Token no recibido del servidor');
        }

        console.log({ user, token, expiresIn });        
        this._currentUser.set(user);
        this._authStatus.set(AuthStatus.authenticated);
        localStorage.setItem('token', token);
        this.isAuthenticated = true;

        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresIn * 1000);
        
        this.saveAuthData(token, expirationDate, email);
      }),
      map(() => true),
      catchError((err) => {
        console.log(err);
        return throwError(() => 'Error de comunicación con el servidor');
      }),
    );
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expiration');
    const user = localStorage.getItem('user');
    if (!token || !expirationDate) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      user: user,
    };
  }

  private saveAuthData(token: string, expirationDate: Date, user: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('user', user);
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) return;
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    
    if (expiresIn > 0) {
      this.isAuthenticated = true;
      this._currentUser.set({email: authInformation.user!});
    }else{
      this.logout();
    }
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  logout() {
    localStorage.removeItem('token');
    this._authStatus.set(AuthStatus.notAuthenticated);
    this.router.navigateByUrl('/login');
  }
}
