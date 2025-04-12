import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { fetch } from '@tauri-apps/plugin-http';
import { Recording } from '../models/recording';
interface Room {
  id: string;
  participants: number;
  created: Date;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  private authToken = environment.apiKey; // Replace with your actual API key
  private apiUrl = 'https://api.videosdk.live/v2/rooms'; // Replace with your actual API URL
  private token='';

  constructor() {
   
  }
  public getToken():string
  {   
    return this.token;
  }
  public async generateAuthToken(): Promise<void> {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      apikey: environment.apiKey,
      permissions: ['allow_join'],
      version: 2,
      iat: now,
      exp: now + (120 * 60) // 120 minutes from now
    };

    // Create the JWT parts
    const encodedHeader = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    // Create the signing input
    const signingInput = encodedHeader + '.' + encodedPayload;
    
    // Convert the secret to a Uint8Array
    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(environment.apiSecret);
    
    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Sign the input
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signingInput)
    );
    
    // Convert the signature to base64url
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Combine all parts
    this.token = `${signingInput}.${signatureBase64}`;
  }
  
  async createMeeting(roomId:string): Promise<string> {
   
    const token = this.token;
    const options = {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({
        "customRoomId" : roomId
       
      }),
    };
    
    const response = await fetch(this.apiUrl, options);    
    if(!response.ok) {
      throw new Error(`Error creating meeting: ${response.statusText}`);
    }
    const data = await response.json();
    return data.roomId;
  }
  
  async validateMeeting(roomId:string): Promise<boolean | null> {
    const url = `{this.apiUrl}/valudate/{roomId}`;
    const token = this.token;
    const options = {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" }    
    };
    
    const response = await fetch(url, options);
  
    return response.ok
  }

  async getRecordings(roomId: string): Promise<Recording> {
    const url = `https://api.videosdk.live/v2/recordings?roomId=${roomId}&page=1&perPage=20}`;
    const token = this.token;
    const options = {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" }    
    };
    
    const response = await fetch(url, options);

    if(!response.ok) {
      throw new Error(`Error getting recordings: ${response.statusText}`);
    }

    const data = await response.json();
    return data as Recording;
  }

  
}  


