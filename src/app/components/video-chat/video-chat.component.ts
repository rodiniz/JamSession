import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { VideoService } from '../../services/video.service';
import { Router } from '@angular/router';
import { message } from '@tauri-apps/plugin-dialog';
@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.css']
  
})
export class VideoChatComponent implements OnInit {
  
  roomIdToJoin =  new FormControl("");
  name = new FormControl("", Validators.required);
  activeRoom: string | null = null;
  router = inject(Router);
  constructor(private videoService: VideoService) {}

  async ngOnInit() {
     await this.videoService.generateAuthToken();
  }

  generateRandomRoomId(): string {
    return Math.random().toString(36).substring(2, 15);
  } 

  async createRoom() {
    if(this.name.value==null || this.name.value==""){  
      await message("Name is required", "error");
      return;
    }
      const roomId = this.generateRandomRoomId();
      try
      {
        var createRoom= await this.videoService.createMeeting(roomId);     
        this.router.navigate(['/meeting', createRoom, this.name.value]);  
      }
      catch (error) {      
        await message("Error creating room", "error");
      }
  }
  async joinMeeting() {
    if(this.name.value==null || this.name.value==""){  
      await message("Name is required", "error");
      return;
    }
    if(this.roomIdToJoin.value==null || this.roomIdToJoin.value==""){  
      await message("Room ID is required", "error");
      return;
    }
    const roomId = this.roomIdToJoin.value; 
    var isValid=await this.videoService.validateMeeting(roomId);
    if(!isValid){
      await message("Room not found", "error");
      return;
    } 
    this.router.navigate(['/meeting', roomId, this.name.value]);   
  }
}