import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MobileService {

  private _isMobileSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public isMobile$: Observable<boolean> = this._isMobileSubject.asObservable();

  setMobileState(isMobile: boolean) {
    this._isMobileSubject.next(isMobile);
  }

}
