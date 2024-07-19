import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-health-check',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './healthCheck.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HealthCheckComponent { 

    urlSafe: SafeResourceUrl;
    url: string = 'http://localhost:3003/status';
  
    constructor(public sanitizer: DomSanitizer) {}
  
    ngOnInit() {
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
    }
}
