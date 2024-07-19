import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { User } from '../../interfaces/user.interface';
import { Patient } from '../../interfaces/patient.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {


  private http = inject(HttpClient);
  backend: string = environment.baseUrl;

  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.backend}/user`);
  }
  getUserById(id: string):Observable<{user: Patient, medicalRecords: any[]}>{
    return this.http.get<any>(`${this.backend}/user/${id}`);
  }

  getUsersByProfile(profile:string): Observable<User[]> {
    return this.http.get<any>(`${this.backend}/user/profile/${profile}`);
  }

  addUser(user: User): Observable<any>{
    return this.http.post<any>(`${this.backend}/user`, user);

  }

  constructor() { }

}
