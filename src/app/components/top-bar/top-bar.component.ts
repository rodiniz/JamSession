import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { Meeting } from '@videosdk.live/js-sdk';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css'
})
export class TopBarComponent {
isRecordingAudio: boolean = false;

  @Input () meetingId: string = '';
  @Input() isRecording: boolean = false;
  @Input() isWebcamOn: boolean = false;
  @Input() isMicOn: boolean = false;
  @Output() toogleWebcam = new EventEmitter();
  @Output() toogleMic = new EventEmitter();
  @Output() toggleScreenShare = new EventEmitter();
  @Output() leaveMeeting = new EventEmitter();
  @Output() startRecording = new EventEmitter();
  @Output() startRecordingAudio = new EventEmitter();

  constructor() {}
  
  fireStartStopRecordingAudio() {
    this.isRecordingAudio = !this.isRecordingAudio;
    this.startRecordingAudio.emit();
  }
     
  fireToggleWebcam() {
    this.isWebcamOn = !this.isWebcamOn;
    this.toogleWebcam.emit();
  }

  fireToggleMic() {
    this.isMicOn = !this.isMicOn;
    this.toogleMic.emit();
  }

  fireLeaveMeeting() {
    this.leaveMeeting.emit();
  }

  fireStartStopRecording() {
    this.isRecording = !this.isRecording;
    this.startRecording.emit();
  }
}
