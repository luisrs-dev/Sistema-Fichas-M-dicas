import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private recognition: any = null;
  private isListening = false;

  isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Inicia la escucha por voz.
   * @param lang Idioma de reconocimiento (por defecto es-CL)
   * @returns Observable que emite el texto reconocido al terminar de hablar
   */
  startListening(lang: string = 'es-CL'): Observable<string> {
    return new Observable<string>((observer) => {
      if (!this.isSupported()) {
        observer.error('SpeechRecognition no está soportado en este navegador. Usa Google Chrome.');
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.lang = lang;
      this.recognition.interimResults = false; // Solo resultados finales
      this.recognition.maxAlternatives = 1;
      this.recognition.continuous = false;

      this.recognition.onresult = (event: any) => {
        const transcript: string = event.results[0][0].transcript;
        observer.next(transcript);
        observer.complete();
      };

      this.recognition.onerror = (event: any) => {
        observer.error(`Error de reconocimiento de voz: ${event.error}`);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
      this.isListening = true;
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  get listening(): boolean {
    return this.isListening;
  }
}
