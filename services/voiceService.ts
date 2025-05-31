import { Audio } from 'expo-av';

export interface VoiceSettings {
  enabled: boolean;
  selectedVoice: string;
}

export interface UnrealSpeechResponse {
  CreationTime: string;
  OutputUri: string;
  RequestCharacters: number;
  TaskId: string;
  TaskStatus: string;
  TimestampsUri: string;
  VoiceId: string;
}

// Available voices from UnrealSpeech API
export const AVAILABLE_VOICES = {
  'American Female': [
    'Autumn', 'Melody', 'Hannah', 'Emily', 'Ivy', 'Kaitlyn', 
    'Luna', 'Willow', 'Lauren', 'Sierra'
  ],
  'American Male': [
    'Noah', 'Jasper', 'Caleb', 'Ronan', 'Ethan', 'Daniel', 'Zane'
  ],
  'Chinese Female': ['Mei', 'Lian', 'Ting', 'Jing'],
  'Chinese Male': ['Wei', 'Jian', 'Hao', 'Sheng'],
  'Spanish Female': ['Lucía'],
  'Spanish Male': ['Mateo', 'Javier'],
  'French Female': ['Élodie'],
  'Hindi Female': ['Ananya', 'Priya'],
  'Hindi Male': ['Arjun', 'Rohan'],
  'Italian Female': ['Giulia'],
  'Italian Male': ['Luca'],
  'Portuguese Female': ['Camila'],
  'Portuguese Male': ['Thiago', 'Rafael'],
};

class VoiceService {
  private unrealSpeechApiKey: string | null = null;
  private currentSound: Audio.Sound | null = null;

  constructor() {
    this.unrealSpeechApiKey = process.env.EXPO_PUBLIC_UNREALSPEECH_API_KEY || null;
    
    // Configure audio mode for speech playback
    this.configureAudioMode();
  }

  private async configureAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('[VoiceService] Failed to configure audio mode:', error);
    }
  }

  async convertTextToSpeech(text: string, voiceId: string = 'Sierra'): Promise<string | null> {
    if (!this.unrealSpeechApiKey) {
      throw new Error('UnrealSpeech API key not configured');
    }

    if (!text || text.trim().length === 0) {
      return null;
    }

    // Truncate text if too long for /speech endpoint (3000 char limit)
    const truncatedText = text.length > 3000 ? text.substring(0, 2950) + '...' : text;

    try {
      const response = await fetch('https://api.v8.unrealspeech.com/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.unrealSpeechApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Text: truncatedText,
          VoiceId: voiceId,
          Bitrate: '192k',
          OutputFormat: 'uri',
          TimestampType: 'sentence',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`UnrealSpeech API error: ${response.status} - ${errorText}`);
      }

      const data: UnrealSpeechResponse = await response.json();
      return data.OutputUri;
    } catch (error) {
      console.error('[VoiceService] Text-to-speech conversion failed:', error);
      throw error;
    }
  }

  async playAudio(audioUrl: string): Promise<void> {
    try {
      // Stop current audio if playing
      if (this.currentSound) {
        await this.stopAudio();
      }

      // Load and play new audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0,
          progressUpdateIntervalMillis: 1000,
        }
      );

      this.currentSound = sound;

      // Set up completion handler
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.cleanup();
        }
      });
    } catch (error) {
      console.error('[VoiceService] Audio playback failed:', error);
      throw error;
    }
  }

  async stopAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.cleanup();
      } catch (error) {
        console.error('[VoiceService] Failed to stop audio:', error);
      }
    }
  }

  private async cleanup(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('[VoiceService] Failed to unload audio:', error);
      }
      this.currentSound = null;
    }
  }

  async convertAndPlay(text: string, voiceId: string = 'Sierra'): Promise<void> {
    try {
      const audioUrl = await this.convertTextToSpeech(text, voiceId);
      if (audioUrl) {
        await this.playAudio(audioUrl);
      }
    } catch (error) {
      console.error('[VoiceService] Convert and play failed:', error);
      throw error;
    }
  }

  isApiConfigured(): boolean {
    return !!this.unrealSpeechApiKey;
  }

  getAllVoices(): { category: string; voices: string[] }[] {
    return Object.entries(AVAILABLE_VOICES).map(([category, voices]) => ({
      category,
      voices,
    }));
  }

  getDefaultVoice(): string {
    return 'Sierra'; // Popular American female voice
  }
}

export const voiceService = new VoiceService(); 