import path from 'path';
export const TERMINAL_STEPS = ['respect_rejection', 'thank_and_close'];

export const audioLibrary: Record<string, string> = {
    'introduce': 'intro.mp3',
    'qualify': 'qualify_questions.mp3',
    'address_objection': 'objection_handling.mp3',
    'confirm_interest': 'confirm_interest.mp3',
    'schedule_followup': 'schedule_followup.mp3',
    'respect_rejection': 'respect_rejection.mp3',
    'thank_and_close': 'thank_you.mp3'
  };


  export class AudioLibrary {
    static getAudioPath( step: string): string {
      const filename = audioLibrary[step];
      if (!filename) {
        throw new Error(`No audio file found for step "${step}"`);
      }
  
      // You can customize this path depending on your setup
      return path.join(__dirname, '../../../public/audio', filename);
    }
  }
  