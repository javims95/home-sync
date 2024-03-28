import { Component } from '@angular/core'
import { OnesignalService } from './services/onesignal/onesignal.service'
import { Platform } from '@ionic/angular'

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
})
export class AppComponent {
    constructor(
        private platform: Platform,
        private onesignal: OnesignalService
    ) {
        this.platform.ready().then(() => {
            this.onesignal.oneSignalInit()
        })
    }
}
