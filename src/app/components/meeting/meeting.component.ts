import { Component, ElementRef, inject, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Meeting, Participant, VideoSDK } from "@videosdk.live/js-sdk";
import { VideoService } from '../../services/video.service';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { Router } from '@angular/router';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [TopBarComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './meeting.component.html',
  styleUrl: './meeting.component.css'  
})
export class MeetingComponent implements OnInit{

  @ViewChild('participantGridContainer') participantGridContainer!: ElementRef;
  @ViewChild('participantScreenShareContainer')
  participantScreenShareContainer!: ElementRef;


  @Input() roomId!: string;
  @Input() name!: string;
  videoService= inject( VideoService); 
  meeting!:Meeting;
  renderer= inject(Renderer2);
  localParticipant: any;
  participants: [] = [];
  showTopBar!: boolean; 
  showMeetingScreen!: boolean;
  showJoinScreen!: boolean;
  isScreenShareOn!: boolean;
  isWebcamOn!: boolean;
  isMicOn!: boolean;
  router = inject(Router);
  recordingStarted: boolean = false;
  mics: any[] = [];
  micSelected= new FormControl();
  async ngOnInit(): Promise<void> {
    VideoSDK.config(this.videoService.getToken());

    this.meeting = VideoSDK.initMeeting({
      meetingId: this.roomId,
      name: this.name,
      micEnabled: true,
      webcamEnabled: true,
      debugMode: true,
    });
    this.handleMeetingEvents(this.meeting);
    this.mics= await this.meeting.getMics();
    

    this.meeting.join();  
  
  }

  onAudioInputChange() {
   this.meeting.changeMic(this.micSelected.value);
  }

  createVideoElement(
    stream: any,
    participant: any,
    participantMediaElement: any
  ) {
    const video = this.renderer.createElement("video");
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    this.renderer.setAttribute(video, "id", `v-${participant.id}`);
    this.renderer.setAttribute(video, "autoplay", "true");
    this.renderer.setAttribute(video, "playsinline", "true");
    this.renderer.setAttribute(video, "muted", "true");
    this.renderer.setAttribute(
      video,
      "style",
      "width: 100%; height: 100%;position: absolute;top: 0;left: 0;object-fit: cover;"
    );
    this.renderer.setProperty(video, "srcObject", mediaStream);
    const videoElement = this.renderer.createElement("div");
    this.renderer.setAttribute(
      videoElement,
      "id",
      `video-container-${participant.id}`
    );

    this.renderer.setAttribute(
      videoElement,
      "style",
      "width: 100%; height: 100%;"
    );
    this.renderer.setStyle(videoElement, "position", "relative");
    this.renderer.appendChild(participantMediaElement, videoElement);
    this.renderer.appendChild(videoElement, video);
    const cornerDisplayName = this.renderer.createElement("div");
    this.renderer.setAttribute(
      cornerDisplayName,
      "id",
      `name-container-${participant.id}`
    );
    this.renderer.setStyle(cornerDisplayName, "position", "absolute");
    this.renderer.setStyle(cornerDisplayName, "bottom", "16px");
    this.renderer.setStyle(cornerDisplayName, "left", "16px");
    this.renderer.setStyle(cornerDisplayName, "color", "white");
    this.renderer.setStyle(
      cornerDisplayName,
      "backgroundColor",
      "rgba(0, 0, 0, 0.5)"
    );
    this.renderer.setStyle(cornerDisplayName, "padding", "2px");
    this.renderer.setStyle(cornerDisplayName, "borderRadius", "2px");
    this.renderer.setStyle(cornerDisplayName, "fontSize", "12px");
    this.renderer.setStyle(cornerDisplayName, "fontWeight", "bold");
    this.renderer.setStyle(cornerDisplayName, "zIndex", "1");
    this.renderer.setStyle(cornerDisplayName, "padding", "4px");
    cornerDisplayName.innerHTML =
      participant.displayName.length > 15
        ? participant.displayName.substring(0, 15) + "..."
        : participant.displayName;
    this.renderer.appendChild(videoElement, cornerDisplayName);
  }

  createNameElemeent(participant: any) {
    var nameElement = this.renderer.createElement('div');
    this.renderer.setAttribute(
      nameElement,
      'id',
      `name-container-${participant.id}`
    );
    nameElement.innerHTML = participant.displayName.charAt(0).toUpperCase();
    this.renderer.setStyle(nameElement, 'backgroundColor', 'black');
    this.renderer.setStyle(nameElement, 'color', 'white');
    this.renderer.setStyle(nameElement, 'textAlign', 'center');
    this.renderer.setStyle(nameElement, 'padding', '32px');
    this.renderer.setStyle(nameElement, 'borderRadius', '100%');
    this.renderer.setStyle(nameElement, 'fontSize', '20px');
    return nameElement;
  }
  createShareAudioElement(stream: any, participant: any) {
    if (participant.pId == this.meeting.localParticipant.id) return;
    const audio = this.renderer.createElement('audio');
    const mediaStream = new MediaStream();

    this.renderer.setAttribute(audio, 'id', `a-share-${participant.id}`);
    this.renderer.setAttribute(audio, 'autoplay', 'true');
    this.renderer.setAttribute(audio, 'playsinline', 'true');
    this.renderer.setAttribute(audio, 'muted', 'true');
    this.renderer.setProperty(audio, 'srcObject', mediaStream);
    this.renderer.appendChild(
      this.participantScreenShareContainer.nativeElement,
      audio
    );
  }

  createShareVideoElement(stream: any, participant: any) {
    if (participant.id == this.meeting.localParticipant.id) return;

    const video = this.renderer.createElement('video');
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    this.renderer.setAttribute(video, 'id', `v-share-${participant.id}`);
    this.renderer.setAttribute(video, 'autoplay', 'true');
    this.renderer.setAttribute(video, 'controls', 'false');

    this.renderer.setAttribute(
      video,
      'style',
      'width: 100%; height: 100%;object-fit: cover;background-color: red;'
    );
    this.renderer.setProperty(video, 'srcObject', mediaStream);

    this.renderer.appendChild(
      this.participantScreenShareContainer.nativeElement,
      video
    );
  }

  handleStreamEnabled(
    stream: any,
    participant: any,
    isLocal: any,
    participantMediaElement: any
  ) {
    if (stream.kind == 'video') {
      var nameElement = document.getElementById(
        `name-container-${participant.id}`
      );
      participantMediaElement.removeChild(nameElement);
      this.createVideoElement(stream, participant, participantMediaElement);
    }   
  }

  handleScreenShareStreamEnabled(stream: any, participant: any, isLocal: any) {
    if (stream.kind == 'share') {
      this.createShareVideoElement(stream, participant);
    }
    if (!isLocal) {
      if (stream.kind == 'audio') {      
        this.createShareAudioElement(stream, participant);
      }
    }
  }

  handleStreamDisabled(
    stream: any,
    participant: any,
    isLocal: any,
    participantMediaElement: any
  ) {
    if (stream.kind == 'video') {
      
      var videoElement = document.getElementById(
        `video-container-${participant.id}`
      );

      var nameElement = this.createNameElemeent(participant);
      this.renderer.removeChild(participantMediaElement, videoElement);
      this.renderer.appendChild(participantMediaElement, nameElement);
    }
    if (!isLocal) {
      if (stream.kind == 'audio') {
        var audioElement = document.getElementById(
          `audio-container-${participant.id}`
        );
        this.renderer.removeChild(participantMediaElement, audioElement);
      }
    }
  }

  handleScreenShareStreamDisabled(stream: any, participant: any, isLocal: any) {
    if (stream.kind == 'share') {
      var videoElement = document.getElementById(`v-share-${participant.id}`);
      this.renderer.removeChild(
        this.participantScreenShareContainer.nativeElement,
        videoElement
      );
    }
    if (!isLocal) {
      if (stream.kind == 'audio') {
        var audioElement = document.getElementById(`a-share-${participant.id}`);
        this.renderer.removeChild(
          this.participantScreenShareContainer.nativeElement,
          audioElement
        );
      }
    }
  }

  participantGridGenerator(participant: any) {
    var participantGridItem = this.renderer.createElement('div');
    this.renderer.setStyle(participantGridItem, 'backgroundColor', 'lightgrey');
    this.renderer.setStyle(participantGridItem, 'borderRadius', '10px');
    this.renderer.setStyle(participantGridItem, 'aspectRatio', 16 / 9);
    this.renderer.setStyle(participantGridItem, 'width', '360px');
    this.renderer.setStyle(participantGridItem, 'marginTop', '8px');
    this.renderer.setStyle(participantGridItem, 'display', 'flex');
    this.renderer.setStyle(participantGridItem, 'alignItems', 'center');
    this.renderer.setStyle(participantGridItem, 'justifyContent', 'center');
    this.renderer.setStyle(participantGridItem, 'overflow', 'hidden');

    this.renderer.setAttribute(
      participantGridItem,
      'id',
      `participant-grid-item-${participant.id}`
    );

    this.renderer.setAttribute(participantGridItem, 'class', 'col-4');

    var participantMediaElement = this.renderer.createElement('div');
    this.renderer.setAttribute(
      participantMediaElement,
      'id',
      `participant-media-container-${participant.id}`
    );
    this.renderer.setStyle(participantMediaElement, 'position', 'relative');
    this.renderer.setStyle(participantMediaElement, 'width', '100%');
    this.renderer.setStyle(participantMediaElement, 'height', '100%');
    this.renderer.setStyle(participantMediaElement, 'display', 'flex');
    this.renderer.setStyle(participantMediaElement, 'alignItems', 'center');
    this.renderer.setStyle(participantMediaElement, 'justifyContent', 'center');
    var nameElement = this.createNameElemeent(participant);
    this.renderer.appendChild(
      this.participantGridContainer.nativeElement,
      participantGridItem
    );

    this.renderer.appendChild(participantGridItem, participantMediaElement);
    this.renderer.appendChild(participantMediaElement, nameElement);
    this.renderer.setStyle(this.participantScreenShareContainer.nativeElement, 'display', 'block');


    var getParticipantMediaElement = document.getElementById(
      `participant-media-container-${participant.id}`
    );

    return {
      getParticipantMediaElement,
    };
  }
  handleMeetingEvents(meeting: any) {
    this.localParticipant = meeting.localParticipant;
    this.participants = meeting.participants;

    meeting.on('meeting-joined', () => {     
      const { getParticipantMediaElement } = this.participantGridGenerator(
        this.meeting.localParticipant
      );
     
      meeting.localParticipant.on('stream-enabled', (stream: any) => {
     
        this.handleStreamEnabled(
          stream,
          meeting.localParticipant,
          true,
          getParticipantMediaElement
        );
      });
      meeting.localParticipant.on('stream-disabled', (stream: any) => {
       
        this.handleStreamDisabled(
          stream,
          meeting.localParticipant,
          true,
          getParticipantMediaElement
        );
        if (stream.kind === 'share') {
          this.isScreenShareOn = !this.isScreenShareOn;
        }
      });
    });

    meeting.on('participant-left', (participant: Participant) => {      

      var participantGridItem = document.getElementById(
        `participant-grid-item-${participant.id}`
      );
      this.participantGridContainer.nativeElement.removeChild(
        participantGridItem
      );
    });

    meeting.on('meeting-left', () => {
     
      // remove all children nodes from participant grid container
      while (this.participantGridContainer.nativeElement.firstChild) {
        this.participantGridContainer.nativeElement.removeChild(
          this.participantGridContainer.nativeElement.firstChild
        );
      }
      
    });

    //remote participant
    meeting.on('participant-joined', (participant: Participant) => {
  

      var { getParticipantMediaElement } =
        this.participantGridGenerator(participant);
      participant.setQuality('high');
      participant.on('stream-enabled', (stream: any) => {
        this.handleStreamEnabled(
          stream,
          participant,
          false,
          getParticipantMediaElement
        );
        if (stream.kind === 'share') {
          this.handleScreenShareStreamEnabled(stream, participant, false);
        }
      });
      participant.on('stream-disabled', (stream: any) => {
        this.handleStreamDisabled(
          stream,
          participant,
          false,
          getParticipantMediaElement
        );
        if (stream.kind === 'share') {
          this.handleScreenShareStreamDisabled(stream, participant, false);
          this.isScreenShareOn = !this.isScreenShareOn;
        }
      });
    });

    meeting.on('recording-started', async () => {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }      
      
      if (permissionGranted) {
        sendNotification({ title: 'Jam Session', body: 'Recording started' });
      }
    });
    meeting.on('recording-stopped', async () => { 
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
    
      if (permissionGranted) {
        sendNotification({ title: 'Jam Session', body: 'Recording stopped' });
      }
    });
    
  }
  toogleWebcam() {
    this.isWebcamOn ?
      this.meeting.disableWebcam():    
      this.meeting.enableWebcam();

    this.isWebcamOn = !this.isWebcamOn;
  }

  toogleMic() {
    this.isMicOn ? this.meeting.muteMic():   this.meeting.unmuteMic();
    this.isMicOn = !this.isMicOn;
  }

  toggleScreenShare() {
    this.isScreenShareOn ?
      this.meeting.enableScreenShare():
      this.meeting.disableScreenShare();   
    this.isScreenShareOn = !this.isScreenShareOn;
  }

  leaveMeeting() {
    this.meeting.leave();
    this.router.navigate(['']);   
  }

  startStopRecording() {
    if(this.recordingStarted){
      this.meeting.stopRecording();
      this.recordingStarted = false;
      return;
    }
    this.recordingStarted = true;
    let config = {
      layout: {
        type: 'GRID',
        priority: "SPEAKER",
        gridSize: 4,
      },
      theme: "DARK",
      mode: "video-and-audio",
      quality: "high",
      orientation: "landscape"
    };
    try{     
      // @ts-ignore
      this.meeting?.startRecording(null,null,config);
    }catch(e){
      alert(e);
    }
  }
}
