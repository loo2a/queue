// Admin Page JavaScript
class AdminManager {
  constructor() {
    this.clinics = {};
    this.centerSettings = {};
    this.init();
  }

  async init() {
    await this.initializeFirebase();
    this.bindEvents();
    this.loadData();
  }

  async initializeFirebase() {
    // Use the common database references from firebase-init.js
    this.database = database;
    this.clinicsRef = clinicsRef;
    this.centerRef = centersRef.child('main');
    this.callsRef = callsRef;
    this.displayRef = displayRef;
    this.emergencyRef = emergencyRef;
  }

  bindEvents() {
    // TTS Speed slider
    const ttsSpeed = document.getElementById('ttsSpeed');
    const ttsSpeedValue = document.getElementById('ttsSpeedValue');
    ttsSpeed.addEventListener('input', (e) => {
      ttsSpeedValue.textContent = e.target.value;
    });

    // Add clinic modal
    document.getElementById('addClinicBtn').addEventListener('click', () => {
      document.getElementById('addClinicModal').classList.remove('hidden');
      document.getElementById('addClinicModal').classList.add('flex');
    });

    document.getElementById('cancelAddClinic').addEventListener('click', () => {
      document.getElementById('addClinicModal').classList.add('hidden');
      document.getElementById('addClinicModal').classList.remove('flex');
    });

    document.getElementById('confirmAddClinic').addEventListener('click', () => {
      this.addClinic();
    });

    // Call specific modal
    document.getElementById('callSpecificBtn').addEventListener('click', () => {
      this.populateClinicsSelect();
      document.getElementById('callSpecificModal').classList.remove('hidden');
      document.getElementById('callSpecificModal').classList.add('flex');
    });

    document.getElementById('cancelCallSpecific').addEventListener('click', () => {
      document.getElementById('callSpecificModal').classList.add('hidden');
      document.getElementById('callSpecificModal').classList.remove('flex');
    });

    document.getElementById('confirmCallSpecific').addEventListener('click', () => {
      this.callSpecificPatient();
    });

    // Quick actions
    document.getElementById('displayNameBtn').addEventListener('click', () => {
      this.displaySpecificName();
    });

    document.getElementById('playAudioBtn').addEventListener('click', () => {
      this.playAudioFile();
    });

    document.getElementById('emergencyBtn').addEventListener('click', () => {
      this.emergencyCall();
    });

    // Save settings
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings();
    });
  }

  async loadData() {
    try {
      // Load center settings
      this.centerRef.on('value', (snapshot) => {
        const centerData = snapshot.val();
        if (centerData) {
          this.centerSettings = centerData.settings || {};
          this.updateUI();
        }
      });

      // Load clinics
      this.clinicsRef.on('value', (snapshot) => {
        this.clinics = snapshot.val() || {};
        this.renderClinics();
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  updateUI() {
    // Update center name
    document.getElementById('centerName').value = this.centerSettings.name || '';
    
    // Update TTS speed
    document.getElementById('ttsSpeed').value = this.centerSettings.ttsSpeed || 1.0;
    document.getElementById('ttsSpeedValue').textContent = this.centerSettings.ttsSpeed || 1.0;
    
    // Update audio settings
    document.getElementById('audioType').value = this.centerSettings.audioType || 'tts';
    document.getElementById('audioPath').value = this.centerSettings.audioPath || './audio';
    document.getElementById('mediaPath').value = this.centerSettings.mediaPath || './media';
    
    // Update news text
    document.getElementById('newsText').value = this.centerSettings.newsText || '';
    
    // Update audio system settings
    if (window.audioSystem) {
      window.audioSystem.setSettings(this.centerSettings);
    }
  }

  renderClinics() {
    const container = document.getElementById('clinicsList');
    container.innerHTML = '';

    Object.keys(this.clinics).forEach(clinicId => {
      const clinic = this.clinics[clinicId];
      const clinicCard = this.createClinicCard(clinicId, clinic);
      container.appendChild(clinicCard);
    });
  }

  createClinicCard(clinicId, clinic) {
    const card = document.createElement('div');
    card.className = 'bg-white/20 rounded-lg p-4 border border-white/30';
    
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-white font-semibold">${clinic.name}</h3>
        <div class="flex space-x-2">
          <button onclick="adminManager.editClinic('${clinicId}')" class="text-blue-300 hover:text-blue-100">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="adminManager.deleteClinic('${clinicId}')" class="text-red-300 hover:text-red-100">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-300">الرقم:</span>
          <span class="text-white">${clinic.number}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-300">الحالة:</span>
          <span class="text-${clinic.status === 'active' ? 'green' : 'red'}-300">${clinic.status === 'active' ? 'نشطة' : 'متوقفة'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-300">الرقم الحالي:</span>
          <span class="text-white font-bold">${clinic.currentNumber}</span>
        </div>
      </div>
    `;
    
    return card;
  }

  addClinic() {
    const name = document.getElementById('newClinicName').value;
    const number = document.getElementById('newClinicNumber').value;
    const password = document.getElementById('newClinicPassword').value;
    const color = document.getElementById('newClinicColor').value;

    if (!name || !number || !password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const clinicId = 'clinic' + Date.now();
    const newClinic = {
      name: name,
      number: parseInt(number),
      password: password,
      color: color,
      currentNumber: 0,
      lastCalled: null,
      status: 'active',
      totalServed: 0
    };

    this.clinicsRef.child(clinicId).set(newClinic)
      .then(() => {
        // Clear form
        document.getElementById('newClinicName').value = '';
        document.getElementById('newClinicNumber').value = '';
        document.getElementById('newClinicPassword').value = '';
        document.getElementById('newClinicColor').value = '#3B82F6';
        
        // Close modal
        document.getElementById('addClinicModal').classList.add('hidden');
        document.getElementById('addClinicModal').classList.remove('flex');
        
        alert('تم إضافة العيادة بنجاح');
      })
      .catch(error => {
        console.error('Error adding clinic:', error);
        alert('حدث خطأ أثناء إضافة العيادة');
      });
  }

  editClinic(clinicId) {
    const clinic = this.clinics[clinicId];
    const newName = prompt('أدخل اسم العيادة الجديد:', clinic.name);
    if (newName && newName !== clinic.name) {
      this.clinicsRef.child(`${clinicId}/name`).set(newName)
        .catch(error => console.error('Error updating clinic:', error));
    }
  }

  deleteClinic(clinicId) {
    if (confirm('هل أنت متأكد من حذف هذه العيادة؟')) {
      this.clinicsRef.child(clinicId).remove()
        .catch(error => console.error('Error deleting clinic:', error));
    }
  }

  populateClinicsSelect() {
    const select = document.getElementById('specificClinic');
    select.innerHTML = '';
    
    Object.keys(this.clinics).forEach(clinicId => {
      const clinic = this.clinics[clinicId];
      const option = document.createElement('option');
      option.value = clinicId;
      option.textContent = clinic.name;
      select.appendChild(option);
    });
  }

  callSpecificPatient() {
    const number = document.getElementById('specificNumber').value;
    const clinicId = document.getElementById('specificClinic').value;
    
    if (!number || !clinicId) {
      alert('يرجى إدخال الرقم واختيار العيادة');
      return;
    }

    // Update clinic current number
    this.clinicsRef.child(`${clinicId}/currentNumber`).set(parseInt(number));
    
    // Play audio
    if (window.audioSystem) {
      window.audioSystem.callPatient(parseInt(number), clinicId, 'specific');
    }

    // Close modal
    document.getElementById('callSpecificModal').classList.add('hidden');
    document.getElementById('callSpecificModal').classList.remove('flex');
    
    // Clear form
    document.getElementById('specificNumber').value = '';
  }

  displaySpecificName() {
    const name = prompt('أدخل اسم العميل لعرضه على الشاشة:');
    if (name) {
      // Save to database for display page
      this.database.ref('display/name').set({
        text: name,
        timestamp: Date.now()
      });
    }
  }

  playAudioFile() {
    const audioFile = prompt('أدخل اسم ملف الصوت (بدون الامتداد):');
    if (audioFile && window.audioSystem) {
      window.audioSystem.playMP3(audioFile);
    }
  }

  emergencyCall() {
    const message = prompt('أدخل رسالة الطوارئ:', 'نداء طارئ - يرجى التوجه فوراً');
    if (message) {
      this.database.ref('emergency').set({
        message: message,
        timestamp: Date.now(),
        active: true
      });
    }
  }

  async saveSettings() {
    try {
      const settings = {
        name: document.getElementById('centerName').value,
        ttsSpeed: parseFloat(document.getElementById('ttsSpeed').value),
        audioType: document.getElementById('audioType').value,
        audioPath: document.getElementById('audioPath').value,
        mediaPath: document.getElementById('mediaPath').value,
        newsText: document.getElementById('newsText').value,
        displayDateTime: true,
        displayQRCode: true,
        alertDuration: 5000
      };

      await this.centerRef.child('settings').set(settings);
      
      // Update audio system
      if (window.audioSystem) {
        window.audioSystem.setSettings(settings);
      }
      
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    }
  }
}

// Initialize admin manager
const adminManager = new AdminManager();