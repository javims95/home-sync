import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AlertController } from '@ionic/angular'
import OneSignal from 'onesignal-cordova-plugin'
import { catchError, of } from 'rxjs'
import { PROTECTED } from 'src/environments/protected'

@Injectable({
    providedIn: 'root',
})
export class OnesignalService {
    constructor(
        private alertCtrl: AlertController,
        private http: HttpClient
    ) {}

    oneSignalInit = () => {
        OneSignal.initialize(PROTECTED.ONE_SIGNAL.APP_ID)

        let myClickListener = async (event: any) => {
            let notificationsData = JSON.stringify(event)
            console.log(notificationsData)
        }
        OneSignal.Notifications.addEventListener('click', myClickListener)
    }

    async oneSignalIOSPermission() {
        try {
            this.oneSignalPermission()
        } catch (e) {
            console.log(e)
        }
    }

    // Call this function when your app starts
    async oneSignalPermission(msg: string = '') {
        try {
            const hasPermission = OneSignal.Notifications.hasPermission()
            console.log('hasPermission: ', hasPermission)
            if (!hasPermission) {
                // show prompt
                this.showAlert(msg)
            }
        } catch (e) {
            throw e
        }
    }

    async requestPermission() {
        try {
            const permission =
                await OneSignal.Notifications.canRequestPermission()
            console.log('permission: ', permission)
            if (permission) {
                // Prompts the user for notification permissions.
                //    * Since this shows a generic native prompt,
                // we recommend instead using an In-App Message to prompt for notification
                // permission (See step 7) to better communicate to your users
                // what notifications they will get.
                const accepted =
                    await OneSignal.Notifications.requestPermission(true)
                console.log('User accepted notifications: ' + accepted)
            } else {
                console.log('permission denied: ', permission)
                this.oneSignalPermission()
            }
        } catch (e) {
            throw e
        }
    }

    showAlert(msg: string) {
        this.alertCtrl
            .create({
                header: `Allow Push Notifications${msg}`,
                message:
                    'Please allow us to send you notifications to get latest offers and order updates...',
                buttons: [
                    {
                        text: "Don't Allow",
                        role: 'cancel',
                        handler: () => {
                            console.log('Confirm Cancel')
                            this.oneSignalPermission(" (It's mandatory)")
                        },
                    },
                    {
                        text: 'Allow',
                        handler: () => {
                            this.requestPermission()
                        },
                    },
                ],
            })
            .then((alertEl) => alertEl.present())
    }

    sendNotification(
        msg: string,
        title: string,
        data: any = null,
        external_id?: any
    ) {
        let body: any = {
            app_id: PROTECTED.ONE_SIGNAL.APP_ID,
            name: 'test',
            target_channel: 'push',
            headings: { en: title },
            contents: { en: msg },
            android_channel_id: PROTECTED.ONE_SIGNAL.ANDROID_CHANNEL_ID,
            // small_icon: 'mipmap/ic_launcher_round',
            // large_icon: 'mipmap/ic_launcher_round',
            small_icon: 'mipmap/ic_notification',
            large_icon: 'mipmap/ic_notification_large',
            // ios_sound: 'sound.wav',
            // filters: [
            //   {
            //     field: 'tag',
            //     key: 'type',
            //     relation: '=',
            //     value: 'user'
            //   },
            // ],
            //data: { notification_info: 'testing notification' }, //pass any object
            data: data,
            // included_segments: ['Active Subscriptions', 'Total Subscriptions'],
        }

        if (external_id) {
            // specific device or deives
            body = {
                ...body,
                include_aliases: {
                    external_id: external_id,
                },
            }
        } else {
            body = {
                ...body,
                included_segments: [
                    'Active Subscriptions',
                    'Total Subscriptions',
                ],
            }
        }

        const headers = new HttpHeaders()
            .set('accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${PROTECTED.ONE_SIGNAL.REST_API_KEY}`)
        return this.http.post<any>(
            'https://onesignal.com/api/v1/notifications',
            body,
            { headers: headers }
        )
    }

    login(uid: string) {
        OneSignal.login(uid)
    }

    logout() {
        OneSignal.logout()
    }

    //onesignal
    createOneSignalUser(uid: string) {
        const app_id = PROTECTED.ONE_SIGNAL.APP_ID

        const body = {
            properties: {
                tags: { type: 'user', uid: uid },
            },
            identity: {
                external_id: uid,
            },
        }

        const headers = new HttpHeaders()
            .set('accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Basic ${PROTECTED.ONE_SIGNAL.REST_API_KEY}`)

        return this.http.post<any>(
            `https://onesignal.com/api/v1/apps/${app_id}/users`,
            body,
            { headers }
        )
    }

    checkOneSignalUserIdentity(uid: string) {
        const app_id = PROTECTED.ONE_SIGNAL.APP_ID

        const headers = new HttpHeaders().set('accept', 'application/json')

        return this.http
            .get<any>(
                `https://onesignal.com/api/v1/apps/${app_id}/users/by/external_id/${uid}/identity`,
                { headers }
            )
            .pipe(
                catchError((e) => {
                    return of(false)
                })
            )
    }

    deleteOneSignalUser(uid: string) {
        const app_id = PROTECTED.ONE_SIGNAL.APP_ID

        const headers = new HttpHeaders().set('accept', 'application/json')

        return this.http
            .delete<any>(
                `https://onesignal.com/api/v1/apps/${app_id}/users/by/external_id/${uid}`,
                { headers }
            )
            .pipe(
                catchError((e) => {
                    return of(false)
                })
            )
    }
}
