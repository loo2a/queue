// Display Page JavaScript
class DisplayManager {
  constructor() {
    this.clinics = {};
    this.centerSettings = {};
    this.currentMediaIndex = 0;
    this.mediaFiles = [];
    this.alertTimeout = null;
    this.init();
  }

  async init() {
    await this.initializeFirebase();
    this.updateDateTime();
    this.loadData();
    this.setupMediaDisplay();
    
    // Update time every second
    setInterval(() => this.updateDateTime(), 1000);
  }

  async initializeFirebase() {
    // Use the common database references from firebase-init.js
    this.database = database;
    this.clinicsRef = clinicsRef;
    this.centerRef = centersRef.child('main');
    this.callsRef = callsRef;
    this.emergencyRef = emergencyRef;
    this.displayRef = displayRef;
  }

  updateDateTime() {
    const now = new Date();
    const dateOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    document.getElementById('currentDate').textContent = now.toLocaleDateString('ar-SA', dateOptions);
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('ar-SA', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async loadData() {
    try {
      // Load center settings
      this.centerRef.on('value', (snapshot) => {
        const centerData = snapshot.val();
        if (centerData) {
          this.centerSettings = centerData.settings || {};
          this.updateDisplaySettings();
        }
      });

      // Load clinics
      this.clinicsRef.on('value', (snapshot) => {
        this.clinics = snapshot.val() || {};
        this.renderClinics();
      });

      // Listen for new calls
      this.callsRef.orderByChild('timestamp').limitToLast(1).on('child_added', (snapshot) => {
        const callData = snapshot.val();
        if (callData && callData.status === 'pending') {
          this.handleNewCall(callData);
        }
      });

      // Listen for emergency calls
      this.emergencyRef.on('value', (snapshot) => {
        const emergencyData = snapshot.val();
        if (emergencyData && emergencyData.active) {
          this.handleEmergency(emergencyData);
        } else {
          this.hideEmergency();
        }
      });

      // Listen for display updates
      this.displayRef.on('value', (snapshot) => {
        const displayData = snapshot.val();
        if (displayData && displayData.name) {
          this.displayCustomName(displayData.name.text);
        }
      });

    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  updateDisplaySettings() {
    // Update center name
    if (this.centerSettings.name) {
      document.getElementById('centerName').textContent = this.centerSettings.name;
    }

    // Update news ticker
    if (this.centerSettings.newsText) {
      document.getElementById('newsText').textContent = this.centerSettings.newsText;
    }

    // Update audio system settings
    if (window.audioSystem) {
      window.audioSystem.setSettings(this.centerSettings);
    }
  }

  renderClinics() {
    const container = document.getElementById('clinicsContainer');
    container.innerHTML = '';

    Object.keys(this.clinics).forEach(clinicId => {
      const clinic = this.clinics[clinicId];
      const clinicCard = this.createClinicCard(clinicId, clinic);
      container.appendChild(clinicCard);
    });
  }

  createClinicCard(clinicId, clinic) {
    const card = document.createElement('div');
    card.className = 'clinic-card glass rounded-lg p-4 border border-white/30';
    card.id = `clinic-${clinicId}`;
    
    const statusColor = clinic.status === 'active' ? 'text-green-300' : 'text-red-300';
    const statusText = clinic.status === 'active' ? 'نشطة' : 'متوقفة';
    
    card.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-white font-bold text-lg">${clinic.name}</h3>
        <div class="w-4 h-4 rounded-full" style="background-color: ${clinic.color || '#3B82F6'}"></div>
      </div>
      <div class="text-center mb-3">
        <div class="text-4xl font-bold text-white mb-1">${clinic.currentNumber}</div>
        <div class="text-sm text-gray-300">الرقم الحالي</div>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-300">الحالة:</span>
        <span class="${statusColor} font-medium">${statusText}</span>
      </div>
      ${clinic.lastCalled ? `
        <div class="flex justify-between text-sm mt-2">
          <span class="text-gray-300">آخر نداء:</span>
          <span class="text-white">${new Date(clinic.lastCalled).toLocaleTimeString('ar-SA')}</span>
        </div>
      ` : ''}
    `;
    
    return card;
  }

  async handleNewCall(callData) {
    const clinic = this.clinics[callData.clinicId];
    if (!clinic) return;

    // Highlight clinic card
    const clinicCard = document.getElementById(`clinic-${callData.clinicId}`);
    if (clinicCard) {
      clinicCard.classList.add('called', 'shake');
      setTimeout(() => {
        clinicCard.classList.remove('shake');
      }, 500);
    }

    // Show alert overlay
    this.showAlert(callData, clinic);

    // Play audio
    if (window.audioSystem) {
      await window.audioSystem.callPatient(callData.number, callData.clinicId, callData.type || 'normal');
    }

    // Mark call as played
    this.callsRef.child(`${callData.callId || Date.now()}/status`).set('played');

    // Remove highlight after alert duration
    setTimeout(() => {
      if (clinicCard) {
        clinicCard.classList.remove('called');
      }
    }, this.centerSettings.alertDuration || 5000);
  }

  showAlert(callData, clinic) {
    const alertOverlay = document.getElementById('alertOverlay');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertMessage = document.getElementById('alertMessage');
    const alertTimestamp = document.getElementById('alertTimestamp');

    // Set alert content
    alertIcon.className = callData.type === 'emergency' ? 
      'fas fa-exclamation-triangle text-6xl text-red-400 mb-4' : 
      'fas fa-bullhorn text-6xl text-yellow-400 mb-4';
    
    alertTitle.textContent = callData.type === 'emergency' ? 'نداء طارئ' : 'نداء جديد';
    alertMessage.textContent = `على العميل رقم ${callData.number} التوجه إلى ${clinic.name}`;
    alertTimestamp.textContent = new Date().toLocaleTimeString('ar-SA');

    // Show overlay
    alertOverlay.classList.remove('hidden');
    alertOverlay.classList.add('flex');

    // Auto hide after duration
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    
    this.alertTimeout = setTimeout(() => {
      this.hideAlert();
    }, this.centerSettings.alertDuration || 5000);
  }

  hideAlert() {
    const alertOverlay = document.getElementById('alertOverlay');
    alertOverlay.classList.add('hidden');
    alertOverlay.classList.remove('flex');
  }

  handleEmergency(emergencyData) {
    const emergencyOverlay = document.getElementById('emergencyOverlay');
    const emergencyMessage = document.getElementById('emergencyMessage');
    
    emergencyMessage.textContent = emergencyData.message || 'نداء طارئ - يرجى التوجه فوراً';
    
    emergencyOverlay.classList.remove('hidden');
    emergencyOverlay.classList.add('flex');
  }

  hideEmergency() {
    const emergencyOverlay = document.getElementById('emergencyOverlay');
    emergencyOverlay.classList.add('hidden');
    emergencyOverlay.classList.remove('flex');
  }

  displayCustomName(name) {
    // Create temporary display for custom name
    const nameOverlay = document.createElement('div');
    nameOverlay.className = 'fixed inset-0 bg-blue-900 bg-opacity-95 flex items-center justify-center z-40';
    nameOverlay.innerHTML = `
      <div class="text-center">
        <h2 class="text-white text-6xl font-bold mb-4">${name}</h2>
        <p class="text-white text-2xl">يرجى التوجه إلى الشاشة</p>
      </div>
    `;
    
    document.body.appendChild(nameOverlay);
    
    setTimeout(() => {
      document.body.removeChild(nameOverlay);
    }, 5000);
  }

  setupMediaDisplay() {
    const mediaDisplay = document.getElementById('mediaDisplay');
    
    // Sample media files (in real implementation, these would be loaded from settings)
    this.mediaFiles = [
      { type: 'image', src: 'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=توعية+صحية+1' },
      { type: 'image', src: 'https://via.placeholder.com/800x600/10B981/FFFFFF?text=توعية+صحية+2' },
      { type: 'image', src: 'https://via.placeholder.com/800x600/F59E0B/FFFFFF?text=توعية+صحية+3' }
    ];
    
    this.startMediaRotation();
  }

  startMediaRotation() {
    if (this.mediaFiles.length === 0) return;
    
    const mediaDisplay = document.getElementById('mediaDisplay');
    
    setInterval(() => {
      const currentMedia = this.mediaFiles[this.currentMediaIndex];
      
      if (currentMedia.type === 'image') {
        mediaDisplay.innerHTML = `
          <img src="${currentMedia.src}" alt="توعية صحية" class="max-w-full max-h-full object-contain rounded-lg">
        `;
      }
      
      this.currentMediaIndex = (this.currentMediaIndex + 1) % this.mediaFiles.length;
    }, 5000); // Change media every 5 seconds
  }

  // Keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'Escape':
          this.hideAlert();
          this.hideEmergency();
          break;
        case 'F11':
          e.preventDefault();
          this.toggleFullscreen();
          break;
      }
    });
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
}

// Initialize display manager
const displayManager = new DisplayManager();

// Setup keyboard shortcuts
displayManager.setupKeyboardShortcuts();