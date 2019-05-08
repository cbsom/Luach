import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from 'react-native-push-notification';
import { log, range } from './GeneralUtils';

export function configureNotifier() {
    PushNotification.configure({
        // (optional) Called when Token is generated (iOS and Android)
        onRegister: function(token) {
            log('TOKEN:', token);
        },

        // (required) Called when a remote or local notification is opened or received
        onNotification: async function(notification) {
            log('NOTIFICATION:', notification);
            notification.finish(PushNotificationIOS.FetchResult.NoData);
        },
        popInitialNotification: true,
        requestPermissions: true,
    });
}

/**
 * Adds a system local scheduled notification
 * @param {Number} id
 * @param {String} title
 * @param {String} message
 * @param {Date} date
 */
export function addNotification(id, title, message, date) {
    PushNotification.localNotificationSchedule({
        date,
        message,
        id: id.toString(), // (optional) Valid unique 32 bit integer specified as string. default: Autogenerated Unique ID
        userInfo: { id: id.toString() },
        ticker: 'Luach Alarm',
        autoCancel: true,
        //largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
        //smallIcon: "ic_notification", // (optional) default: "ic_notification" with fallback for "ic_launcher"
        bigText: message,
        subText: title,
        //color: "red", // (optional) default: system default
        vibrate: true,
        vibration: 1000,
        //tag: 'some_tag', // (optional) add tag to message
        //group: "group", // (optional) add group to message
        ongoing: false,
        priority: 'high',
        visibility: 'private',
        importance: 'high',
        title: title,
        playSound: true,
        soundName: 'default',
        number: '10',
        //repeatType: 'day', // (optional) Repeating interval. Check 'Repeating Notifications' section for more info.
        actions: '["Confirm", "Snooze"]',
    });
}

/**
 *
 * @param {id:number} id
 */
export function cancelAlarm(id) {
    PushNotification.cancelLocalNotifications({
        id: id.toString(),
    });
}

/**
 *
 * @param {id:number} id
 */
export function cancelAllHefsekAlarms(taharaEventId) {
    for (let i of range(25)) {
        try {
            cancelAlarm(taharaEventId.toString() + i.toString());
        } catch (e) {
            /*Nu, nu*/
        }
    }
}
