import {apiCall} from './core';
export type NotificationPreferences={optionalEmail:boolean};
export const getNotificationPreferences=(token:string)=>apiCall<NotificationPreferences>(token,'/v1/account/notifications');
export const saveNotificationPreferences=(token:string,optionalEmail:boolean)=>apiCall<NotificationPreferences>(token,'/v1/account/notifications',{method:'PUT',body:{optionalEmail}});
