import { Routes } from "@angular/router";


export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./components/video-chat/video-chat.component')
      .then(m => m.VideoChatComponent) },
  {
    path: 'meeting/:roomId/:name',
     loadComponent: () => import('./components/meeting/meeting.component')
      .then(m => m.MeetingComponent)
  }
    
];