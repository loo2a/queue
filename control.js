// Control Page JavaScript
class ControlManager {
  constructor() {
    this.clinics = {};
    this.selectedClinic = null;
    this.currentClinicData = null;
    this.init();
  }

  async init() {
    await this.initializeFirebase();
    this.bindEvents();
    this.loadClinics();
  }

  async initializeFirebase() {
    // Use the common database references from firebase-init.js
    this.database = database;
    this.clinicsRef = clinicsRef;
    this.callsRef = callsRef;
    this.emergencyRef = emergencyRef;
    this.displayRef = displayRef;
    this.centerRef = centersRef.child('main');
  }

  bindEvents() {
    // Control buttons
    document.getElementById('nextBtn').addEventListener('click', () => this.nextPatient());
    document.getElementById('prevBtn').addEventListener('click', () => this.prevPatient());
    document.getElementById('repeatBtn').addEventListener('click', () => this.repeatCall());
    document.getElementById('resetBtn').addEventListener('click', () => this.resetClinic());
    document.getElementById('pauseBtn').addEventListener('click', () => this.pauseClinic());
    document.getElementById('resumeBtn').addEventListener('click', () => this.resumeClinic());
    document.getElementById('callSpecificBtn').addEventListener('click', () => this.showCallSpecificModal());
    document.getElementById('emergencyBtn').addEventListener('click', () => this.emergencyCall());
    document.getElementById('displayNameBtn').addEventListener('click', () => this.showDisplayNameModal());
    document.getElementById('exitBtn').addEventListener('click', () => this.exit());

    // Modal events
    document.getElementById('cancelCallSpecific').addEventListener('click', () => this.hideCallSpecificModal());
    document.getElementById('confirmCallSpecific').addEventListener('click', () => this.callSpecificNumber());
    document.getElementById('cancelDisplayName').addEventListener('click', () => this.hideDisplayNameModal());
    document.getElementById('confirmDisplayName').addEventListener('click', () => this.displayName());
  }

  async loadClinics() {
    try {
      this.clinicsRef.on('value', (snapshot) => {
        this.clinics = snapshot.val() || {};
        this.renderClinicSelection();
      });
    } catch (error) {
      console.error('Error loading clinics:', error);
    }
  }

  renderClinicSelection() {
    const container = document.getElementById('clinicsGrid');
    container.innerHTML = '';

    Object.keys(this.clinics).forEach(clinicId => {
      const clinic = this.clinics[clinicId];
      const clinicCard = this.createClinicSelectionCard(clinicId, clinic);
      container.appendChild(clinicCard);
    });
  }

  createClinicSelectionCard(clinicId, clinic) {
    const card = document.createElement('div');
    card.className = 'glass rounded-lg p-6 cursor-pointer card-hover clinic-status-' + clinic.status;
    
    card.innerHTML = `
      <div class="text-center">
        <div class="w-12 h-12 rounded-full mx-auto mb-4" style="background-color: ${clinic.color || '#3B82F6'}"></div>
        <h3 class="text-white text-xl font-bold mb-2">${clinic.name}</h3>
        <div class="text-3xl font-bold text-white mb-2">${clinic.currentNumber}</div>
        <div class="text-sm text-gray-300 mb-4">الرقم الحالي</div>
        <div class="text-sm text-gray-400">رقم العيادة: ${clinic.number}</div>
        <div class="mt-4">
          <input type="password" id="password-${clinicId}" 
                 class="w-full px-3 py-2 rounded bg-white/20 text-white border border-white/30 text-center"
                 placeholder="أدخل كلمة المرور">
        </div>
        <button onclick="controlManager.selectClinic('${clinicId}')" 
                class="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors">
          <i class="fas fa-sign-in-alt ml-1"></i> دخول
        </button>
      </div>
    `;
    
    return card;
  }

  selectClinic(clinicId) {
    const passwordInput = document.getElementById(`password-${clinicId}`);
    const password = passwordInput.value;
    
    if (!password) {
      alert('يرجى إدخال كلمة المرور');
      return;
    }

    const clinic = this.clinics[clinicId];
    if (clinic.password !== password) {
      alert('كلمة المرور غير صحيحة');
      return;
    }

    this.selectedClinic = clinicId;
    this.currentClinicData = clinic;
    
    this.showControlPanel();
    this.startListeningToClinic();
  }

  showControlPanel() {
    document.getElementById('clinicSelection').classList.add('hidden');
    document.getElementById('controlPanel').classList.remove('hidden');
    
    this.updateClinicInfo();
  }

  updateClinicInfo() {
    if (!this.currentClinicData) return;
    
    document.getElementById('currentClinicName').textContent = this.currentClinicData.name;
    document.getElementById('currentClinicColor').style.backgroundColor = this.currentClinicData.color || '#3B82F6';
    document.getElementById('currentNumber').textContent = this.currentClinicData.currentNumber;
    document.getElementById('totalServed').textContent = this.currentClinicData.totalServed || 0;
    document.getElementById('waitingTime').textContent = this.calculateWaitingTime();
    
    const statusElement = document.getElementById('currentClinicStatus');
    const status = this.currentClinicData.status || 'active';
    statusElement.textContent = status === 'active' ? 'نشطة' : status === 'paused' ? 'موقوفة' : 'متوقفة';
    statusElement.className = status === 'active' ? 'text-green-300 font-medium' : 
                              status === 'paused' ? 'text-yellow-300 font-medium' : 'text-red-300 font-medium';
  }

  calculateWaitingTime() {
    // Simple waiting time calculation (in minutes)
    const currentNumber = this.currentClinicData.currentNumber || 0;
    return Math.max(0, currentNumber * 5); // Assuming 5 minutes per patient
  }

  startListeningToClinic() {
    if (!this.selectedClinic) return;
    
    this.clinicsRef.child(this.selectedClinic).on('value', (snapshot) => {
      this.currentClinicData = snapshot.val();
      this.updateClinicInfo();
    });
  }

  async nextPatient() {
    if (!this.selectedClinic || !this.currentClinicData) return;
    
    const newNumber = (this.currentClinicData.currentNumber || 0) + 1;
    
    try {
      await this.clinicsRef.child(`${this.selectedClinic}/currentNumber`).set(newNumber);
      await this.clinicsRef.child(`${this.selectedClinic}/lastCalled`).set(Date.now());
      await this.clinicsRef.child(`${this.selectedClinic}/totalServed`).set((this.currentClinicData.totalServed || 0) + 1);
      
      // Create call record
      const callRecord = {
        clinicId: this.selectedClinic,
        number: newNumber,
        type: 'next',
        timestamp: Date.now(),
        status: 'pending'
      };
      
      await this.callsRef.push(callRecord);
      
      // Play audio
      if (window.audioSystem) {
        window.audioSystem.callPatient(newNumber, this.selectedClinic, 'next');
      }
      
    } catch (error) {
      console.error('Error calling next patient:', error);
      alert('حدث خطأ أثناء نداء المريض التالي');
    }
  }

  async prevPatient() {
    if (!this.selectedClinic || !this.currentClinicData) return;
    
    const newNumber = Math.max(0, (this.currentClinicData.currentNumber || 0) - 1);
    
    try {
      await this.clinicsRef.child(`${this.selectedClinic}/currentNumber`).set(newNumber);
      
      // Create call record
      const callRecord = {
        clinicId: this.selectedClinic,
        number: newNumber,
        type: 'previous',
        timestamp: Date.now(),
        status: 'pending'
      };
      
      await this.callsRef.push(callRecord);
      
      // Play audio
      if (window.audioSystem) {
        window.audioSystem.callPatient(newNumber, this.selectedClinic, 'previous');
      }
      
    } catch (error) {
      console.error('Error calling previous patient:', error);
      alert('حدث خطأ أثناء نداء المريض السابق');
    }
  }

  async repeatCall() {
    if (!this.selectedClinic || !this.currentClinicData) return;
    
    const currentNumber = this.currentClinicData.currentNumber || 0;
    
    try {
      // Create call record
      const callRecord = {
        clinicId: this.selectedClinic,
        number: currentNumber,
        type: 'repeat',
        timestamp: Date.now(),
        status: 'pending'
      };
      
      await this.callsRef.push(callRecord);
      
      // Play audio
      if (window.audioSystem) {
        window.audioSystem.callPatient(currentNumber, this.selectedClinic, 'repeat');
      }
      
    } catch (error) {
      console.error('Error repeating call:', error);
      alert('حدث خطأ أثناء تكرار النداء');
    }
  }

  async resetClinic() {
    if (!this.selectedClinic) return;
    
    if (!confirm('هل أنت متأكد من تصفير العيادة؟ سيتم إعادة العداد إلى صفر.')) {
      return;
    }
    
    try {
      await this.clinicsRef.child(`${this.selectedClinic}/currentNumber`).set(0);
      await this.clinicsRef.child(`${this.selectedClinic}/totalServed`).set(0);
      
      alert('تم تصفير العيادة بنجاح');
    } catch (error) {
      console.error('Error resetting clinic:', error);
      alert('حدث خطأ أثناء تصفير العيادة');
    }
  }

  async pauseClinic() {
    if (!this.selectedClinic) return;
    
    try {
      await this.clinicsRef.child(`${this.selectedClinic}/status`).set('paused');
      alert('تم إيقاف العيادة مؤقتاً');
    } catch (error) {
      console.error('Error pausing clinic:', error);
      alert('حدث خطأ أثناء إيقاف العيادة');
    }
  }

  async resumeClinic() {
    if (!this.selectedClinic) return;
    
    try {
      await this.clinicsRef.child(`${this.selectedClinic}/status`).set('active');
      alert('تم استئناف العيادة');
    } catch (error) {
      console.error('Error resuming clinic:', error);
      alert('حدث خطأ أثناء استئناف العيادة');
    }
  }

  showCallSpecificModal() {
    document.getElementById('callSpecificModal').classList.remove('hidden');
    document.getElementById('callSpecificModal').classList.add('flex');
  }

  hideCallSpecificModal() {
    document.getElementById('callSpecificModal').classList.add('hidden');
    document.getElementById('callSpecificModal').classList.remove('flex');
    document.getElementById('specificNumber').value = '';
  }

  async callSpecificNumber() {
    const number = parseInt(document.getElementById('specificNumber').value);
    
    if (!number || number < 0) {
      alert('يرجى إدخال رقم صحيح');
      return;
    }
    
    if (!this.selectedClinic) return;
    
    try {
      // Update clinic current number
      await this.clinicsRef.child(`${this.selectedClinic}/currentNumber`).set(number);
      
      // Create call record
      const callRecord = {
        clinicId: this.selectedClinic,
        number: number,
        type: 'specific',
        timestamp: Date.now(),
        status: 'pending'
      };
      
      await this.callsRef.push(callRecord);
      
      // Play audio
      if (window.audioSystem) {
        window.audioSystem.callPatient(number, this.selectedClinic, 'specific');
      }
      
      this.hideCallSpecificModal();
      
    } catch (error) {
      console.error('Error calling specific number:', error);
      alert('حدث خطأ أثناء نداء الرقم المحدد');
    }
  }

  async emergencyCall() {
    if (!this.selectedClinic) return;
    
    const message = prompt('أدخل رسالة الطوارئ:', 'نداء طارئ - يرجى التوجه فوراً');
    if (!message) return;
    
    try {
      const currentNumber = this.currentClinicData.currentNumber || 0;
      
      // Create emergency call record
      const callRecord = {
        clinicId: this.selectedClinic,
        number: currentNumber,
        type: 'emergency',
        message: message,
        timestamp: Date.now(),
        status: 'pending'
      };
      
      await this.callsRef.push(callRecord);
      
      // Set emergency in database
      await this.emergencyRef.set({
        message: message,
        clinicId: this.selectedClinic,
        timestamp: Date.now(),
        active: true
      });
      
      // Play audio
      if (window.audioSystem) {
        window.audioSystem.callPatient(currentNumber, this.selectedClinic, 'emergency');
      }
      
      alert('تم إرسال نداء الطوارئ');
      
    } catch (error) {
      console.error('Error emergency call:', error);
      alert('حدث خطأ أثناء إرسال نداء الطوارئ');
    }
  }

  showDisplayNameModal() {
    document.getElementById('displayNameModal').classList.remove('hidden');
    document.getElementById('displayNameModal').classList.add('flex');
  }

  hideDisplayNameModal() {
    document.getElementById('displayNameModal').classList.add('hidden');
    document.getElementById('displayNameModal').classList.remove('flex');
    document.getElementById('displayNameInput').value = '';
  }

  async displayName() {
    const name = document.getElementById('displayNameInput').value;
    
    if (!name) {
      alert('يرجى إدخال اسم العميل');
      return;
    }
    
    try {
      await this.displayRef.child('name').set({
        text: name,
        timestamp: Date.now()
      });
      
      this.hideDisplayNameModal();
      alert('تم عرض الاسم على الشاشة');
      
    } catch (error) {
      console.error('Error displaying name:', error);
      alert('حدث خطأ أثناء عرض الاسم');
    }
  }

  exit() {
    if (confirm('هل أنت متأكد من الخروج؟')) {
      this.selectedClinic = null;
      this.currentClinicData = null;
      
      document.getElementById('controlPanel').classList.add('hidden');
      document.getElementById('clinicSelection').classList.remove('hidden');
      
      // Clear password inputs
      const passwordInputs = document.querySelectorAll('[id^="password-"]');
      passwordInputs.forEach(input => input.value = '');
    }
  }
}

// Initialize control manager
const controlManager = new ControlManager();