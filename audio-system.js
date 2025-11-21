// Audio System for Queue Management
class AudioSystem {
  constructor() {
    this.audioPath = './audio';
    this.audioType = 'tts'; // 'tts' or 'mp3'
    this.ttsSpeed = 1.0;
    this.isPlaying = false;
    this.audioQueue = [];
    this.currentAudio = null;
    
    // Load settings from Firebase
    this.loadSettings();
    
    // Arabic number mappings
    this.arabicNumbers = {
      1: 'واحد', 2: 'اثنان', 3: 'ثلاثة', 4: 'أربعة', 5: 'خمسة',
      6: 'ستة', 7: 'سبعة', 8: 'ثمانية', 9: 'تسعة', 10: 'عشرة',
      11: 'أحد عشر', 12: 'اثنا عشر', 13: 'ثلاثة عشر', 14: 'أربعة عشر',
      15: 'خمسة عشر', 16: 'ستة عشر', 17: 'سبعة عشر', 18: 'ثمانية عشر',
      19: 'تسعة عشر', 20: 'عشرون', 30: 'ثلاثون', 40: 'أربعون',
      50: 'خمسون', 60: 'ستون', 70: 'سبعون', 80: 'ثمانون', 90: 'تسعون',
      100: 'مئة', 200: 'مئتان', 300: 'ثلاثمئة', 400: 'أربعمئة',
      500: 'خمسمئة', 600: 'ستمئة', 700: 'سبعمئة', 800: 'ثمانمئة', 900: 'تسعمئة'
    };
    
    this.clinicNames = {
      'clinic1': 'عيادة طب الأسرة',
      'clinic2': 'عيادة الباطنة',
      'clinic3': 'عيادة الأطفال',
      'clinic4': 'عيادة الجلدية',
      'clinic5': 'عيادة النساء'
    };
  }
  
  // Convert number to Arabic words
  numberToArabicWords(number) {
    if (number === 0) return 'صفر';
    if (number <= 20) return this.arabicNumbers[number];
    
    let result = '';
    
    // Handle hundreds
    if (number >= 100) {
      const hundreds = Math.floor(number / 100) * 100;
      result += this.arabicNumbers[hundreds];
      number %= 100;
      if (number > 0) result += ' و';
    }
    
    // Handle tens and units
    if (number > 0) {
      if (number <= 20) {
        result += this.arabicNumbers[number];
      } else {
        const tens = Math.floor(number / 10) * 10;
        const units = number % 10;
        result += this.arabicNumbers[tens];
        if (units > 0) {
          result += ' و' + this.arabicNumbers[units];
        }
      }
    }
    
    return result;
  }
  
  // Generate call text
  generateCallText(number, clinicId, callType = 'normal') {
    const clinicName = this.clinicNames[clinicId] || 'العيادة';
    const numberText = this.numberToArabicWords(number);
    
    switch (callType) {
      case 'normal':
        return `على العميل رقم ${numberText} التوجه إلى ${clinicName}`;
      case 'emergency':
        return `نداء طارئ - على العميل رقم ${numberText} التوجه فوراً إلى ${clinicName}`;
      case 'repeat':
        return `تكرار - على العميل رقم ${numberText} التوجه إلى ${clinicName}`;
      default:
        return `على العميل رقم ${numberText} التوجه إلى ${clinicName}`;
    }
  }
  
  // Play TTS audio
  async playTTS(text) {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = this.ttsSpeed;
        utterance.pitch = 1;
        
        utterance.onend = () => {
          this.isPlaying = false;
          resolve();
        };
        
        utterance.onerror = (error) => {
          this.isPlaying = false;
          reject(error);
        };
        
        this.isPlaying = true;
        speechSynthesis.speak(utterance);
      } else {
        reject(new Error('TTS not supported'));
      }
    });
  }
  
  // Play MP3 audio
  async playMP3(filename) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`${this.audioPath}/${filename}.mp3`);
      
      audio.onended = () => {
        this.isPlaying = false;
        resolve();
      };
      
      audio.onerror = (error) => {
        this.isPlaying = false;
        reject(error);
      };
      
      this.currentAudio = audio;
      this.isPlaying = true;
      audio.play();
    });
  }
  
  // Play sequence of MP3 files for number
  async playNumberSequence(number) {
    if (this.audioType === 'tts') {
      return this.playTTS(this.numberToArabicWords(number));
    }
    
    const files = [];
    
    if (number === 0) {
      files.push('zero.mp3');
    } else if (number <= 20) {
      files.push(`${number}.mp3`);
    } else {
      // Handle hundreds
      if (number >= 100) {
        const hundreds = Math.floor(number / 100) * 100;
        files.push(`${hundreds}.mp3`);
        number %= 100;
        if (number > 0) {
          files.push('and.mp3');
        }
      }
      
      // Handle tens and units
      if (number > 0) {
        if (number <= 20) {
          files.push(`${number}.mp3`);
        } else {
          const tens = Math.floor(number / 10) * 10;
          const units = number % 10;
          files.push(`${tens}.mp3`);
          if (units > 0) {
            files.push('and.mp3');
            files.push(`${units}.mp3`);
          }
        }
      }
    }
    
    // Play files in sequence
    for (const file of files) {
      await this.playMP3(file);
    }
  }
  
  // Main call function
  async callPatient(number, clinicId, callType = 'normal') {
    if (this.isPlaying) {
      this.audioQueue.push({ number, clinicId, callType });
      return;
    }
    
    try {
      if (this.audioType === 'tts') {
        const text = this.generateCallText(number, clinicId, callType);
        await this.playTTS(text);
      } else {
        // Play MP3 sequence
        await this.playMP3('call_start.mp3');
        await this.playNumberSequence(number);
        await this.playMP3('call_clinic.mp3');
        
        const clinicName = this.clinicNames[clinicId];
        if (clinicName) {
          const clinicFile = clinicName.replace(/\s+/g, '_') + '.mp3';
          await this.playMP3(clinicFile);
        }
      }
      
      // Process next in queue
      if (this.audioQueue.length > 0) {
        const nextCall = this.audioQueue.shift();
        setTimeout(() => this.callPatient(nextCall.number, nextCall.clinicId, nextCall.callType), 1000);
      }
      
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
    }
  }
  
  // Stop current audio
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    this.isPlaying = false;
    this.audioQueue = [];
  }
  
  // Set audio settings
  setSettings(settings) {
    this.audioType = settings.audioType || 'tts';
    this.ttsSpeed = settings.ttsSpeed || 1.0;
    this.audioPath = settings.audioPath || './audio';
  }
  
  // Load settings from Firebase
  async loadSettings() {
    try {
      const snapshot = await centersRef.child('main/settings').once('value');
      const settings = snapshot.val();
      if (settings) {
        this.setSettings(settings);
      }
    } catch (error) {
      console.error('Error loading audio settings:', error);
    }
  }
}

// Create global instance
window.audioSystem = new AudioSystem();