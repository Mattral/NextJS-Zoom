// src/global.d.ts

interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  
  declare interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  