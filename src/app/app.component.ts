import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VideoChatComponent } from './components/video-chat/video-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Video Chat App';
}