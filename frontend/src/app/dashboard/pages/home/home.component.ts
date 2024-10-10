import { User } from '../../../auth/interfaces/login-response.interface';
import { AuthService } from './../../../auth/auth.service';
import { UserService } from './../users/user.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './home.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent {

    private authService = inject(AuthService)
    public user: User;

    ngOnInit(): void {

    this.user = this.authService.getUser();
    console.log(this.user);
    

        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        
    }
 }
