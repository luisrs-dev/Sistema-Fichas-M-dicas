import { CommonModule } from '@angular/common';
import {
  DestroyRef,
  Component,
  inject
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../angular-material/material.module';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AuthService } from './../../auth.service';
import { AuthStatus } from './../../interfaces/auth-status.enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, timeout, timer } from 'rxjs';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule,
    SpinnerComponent, 
    MatProgressBarModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export default class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  public authStatus: AuthStatus = AuthStatus.notAuthenticated;
  public loading: boolean = false;
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  public readonly showServerStatus = environment.showServerStatus;
  public serverState: 'checking' | 'ready' | 'unavailable' = this.showServerStatus ? 'checking' : 'ready';
  public slowConnection = false;

  public get serverMessage(): string {
    if (this.serverState === 'ready') return 'Sistema listo para iniciar sesión';
    if (this.slowConnection) return 'El inicio está tardando más de lo habitual. Reintentando…';
    return this.serverState === 'checking'
      ? 'Conectando con el servidor…'
      : 'Servidor no disponible. Reintentando…';
  }

  constructor() {
    if (!this.showServerStatus) return;
    let unavailableSince = Date.now();
    timer(0, 3000).pipe(
      exhaustMap(() => this.http.get<{ status: string }>(`${environment.baseUrl}/health/ready`).pipe(
        timeout(2500),
        map(response => response.status === 'ready'),
        catchError(() => of(false)),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(ready => {
      if (ready || this.serverState === 'ready') unavailableSince = Date.now();
      this.serverState = ready ? 'ready' : 'unavailable';
      this.slowConnection = !ready && Date.now() - unavailableSince >= 30000;
    });
  }

  public myForm: FormGroup = this.fb.group({
    email: [environment.userDefault.email, [Validators.required, Validators.email]],
    password: [environment.userDefault.password, [Validators.required, Validators.minLength(4)]],
  });

  onSubmit(): void {
    if (this.serverState !== 'ready' || this.loading) return;
    const { email, password } = this.myForm.value;
    if (this.myForm.invalid) {
      this.myForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authStatus = AuthStatus.checking;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: (message) => {
        this.loading = false;
        this.authStatus = AuthStatus.notAuthenticated;
        this.snackBar.open(`${message}`, 'Entendido', { duration: 3000});
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
