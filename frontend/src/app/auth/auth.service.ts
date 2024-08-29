import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { AuthStatus } from './interfaces/auth-status.enum';
import { LoginResponse, Permission, User } from './interfaces/login-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl: string = environment.baseUrl;
  private router = inject(Router);

  // private _currentUser = signal<User | null>(null);
  private _authStatus = signal<AuthStatus>(AuthStatus.checking);
  private isAuthenticated: boolean = false;

  private http = inject(HttpClient);
  private user: User;

  login(email: string, password: string): Observable<boolean> {
    const url = `${this.baseUrl}/auth/login`;
    const body = { email, password };

    return this.http.post<LoginResponse>(url, body).pipe(
      tap(({ user, token, expiresIn }) => {
        this.user = user;

        if (!token) {
          throw new Error('Token no recibido del servidor');
        }

        // this._currentUser.set(id);
        this._authStatus.set(AuthStatus.authenticated);
        localStorage.setItem('token', token);
        this.isAuthenticated = true;

        const now = new Date();
        const expirationDate = new Date(now.getTime() + expiresIn * 1000);
        
        this.saveAuthData(token, expirationDate, user);
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
    if (!token || !expirationDate || !user) {
      return;
    }
    return {
      token: token,
      expirationDate: new Date(expirationDate),
      user: user,
    };
  }

  private saveAuthData(token: string, expirationDate: Date, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    this.setUser(user);
  }

  autoAuthUser() {
    const authInformation = this.getAuthData();
    if (!authInformation) return;
    const now = new Date();
    const expiresIn = authInformation.expirationDate.getTime() - now.getTime();
    
    if (expiresIn > 0) {
      this.isAuthenticated = true;
      // this._currentUser.set({email: authInformation.user!});
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

  getUser() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    return this.user;
  }

  setUser(user: User){
    localStorage.setItem('user', JSON.stringify(user));
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user.permissions.some((permission: Permission) => permission.value === 'admin');
  }

  canCreateUser(): boolean{
    const user = this.getUser();
    return user && user.permissions && user.permissions.some((permission: Permission) => permission.value === 'crear-editar-usuario');

  }
}
