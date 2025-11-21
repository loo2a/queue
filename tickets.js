// Tickets Page JavaScript
class TicketsManager {
  constructor() {
    this.clinics = {};
    this.selectedClinic = null;
    this.selectedClinicData = null;
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
  }

  bindEvents() {
    document.getElementById('previewBtn').addEventListener('click', () => this.previewTickets());
    document.getElementById('printBtn').addEventListener('click', () => this.printTickets());
    
    // Update preview when inputs change
    document.getElementById('startNumber').addEventListener('input', () => this.updatePreview());
    document.getElementById('endNumber').addEventListener('input', () => this.updatePreview());
    document.getElementById('columns').addEventListener('change', () => this.updatePreview());
    document.getElementById('fontSize').addEventListener('change', () => this.updatePreview());
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
    card.className = 'glass rounded-lg p-6 cursor-pointer card-hover text-center';
    
    card.innerHTML = `
      <div class="w-16 h-16 rounded-full mx-auto mb-4" style="background-color: ${clinic.color || '#3B82F6'}"></div>
      <h3 class="text-white text-xl font-bold mb-2">${clinic.name}</h3>
      <div class="text-3xl font-bold text-white mb-2">${clinic.currentNumber || 0}</div>
      <div class="text-sm text-gray-300 mb-4">الرقم الحالي</div>
      <div class="text-sm text-gray-400 mb-4">رقم العيادة: ${clinic.number}</div>
      <button onclick="ticketsManager.selectClinic('${clinicId}')" 
              class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
        <i class="fas fa-ticket-alt ml-1"></i> اختيار
      </button>
    `;
    
    return card;
  }

  selectClinic(clinicId) {
    this.selectedClinic = clinicId;
    this.selectedClinicData = this.clinics[clinicId];
    
    document.getElementById('ticketConfig').classList.remove('hidden');
    
    // Update end number based on current clinic number
    const currentNumber = this.selectedClinicData.currentNumber || 0;
    const endNumber = Math.max(currentNumber + 20, 20);
    document.getElementById('endNumber').value = endNumber;
  }

  generateTickets(startNumber, endNumber) {
    const tickets = [];
    
    for (let i = startNumber; i <= endNumber; i++) {
      tickets.push({
        number: i,
        clinicName: this.selectedClinicData.name,
        clinicNumber: this.selectedClinicData.number,
        currentNumber: this.selectedClinicData.currentNumber || 0,
        waitingTime: Math.max(0, (i - (this.selectedClinicData.currentNumber || 0)) * 5),
        date: new Date().toLocaleDateString('ar-SA'),
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      });
    }
    
    return tickets;
  }

  createTicketHTML(ticket, isPreview = false) {
    const waitingPatients = Math.max(0, ticket.number - ticket.currentNumber);
    const fontSize = isPreview ? '14px' : document.getElementById('fontSize').value + 'px';
    
    return `
      <div class="ticket-preview" style="font-size: ${fontSize};">
        <div style="font-weight: bold; font-size: 1.2em; margin-bottom: 8px;">
          ${ticket.clinicName}
        </div>
        <div style="font-size: 2em; font-weight: bold; color: #1f2937; margin-bottom: 8px;">
          ${ticket.number}
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6b7280;">الحالي:</span> ${ticket.currentNumber}
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6b7280;">المنتظرون:</span> ${waitingPatients}
        </div>
        <div style="margin-bottom: 4px;">
          <span style="color: #6b7280;">الوقت المتوقع:</span> ${ticket.waitingTime} دقيقة
        </div>
        <div style="font-size: 0.8em; color: #9ca3af; margin-top: 8px;">
          ${ticket.date} ${ticket.time}
        </div>
      </div>
    `;
  }

  previewTickets() {
    const startNumber = parseInt(document.getElementById('startNumber').value);
    const endNumber = parseInt(document.getElementById('endNumber').value);
    
    if (!this.selectedClinic) {
      alert('يرجى اختيار عيادة أولاً');
      return;
    }
    
    if (!startNumber || !endNumber || startNumber > endNumber) {
      alert('يرجى إدخال أرقام صحيحة');
      return;
    }
    
    const tickets = this.generateTickets(startNumber, endNumber);
    const previewContainer = document.getElementById('ticketsPreview');
    
    previewContainer.innerHTML = '';
    
    // Show only first 6 tickets in preview
    const previewTickets = tickets.slice(0, 6);
    previewTickets.forEach(ticket => {
      previewContainer.innerHTML += this.createTicketHTML(ticket, true);
    });
    
    if (tickets.length > 6) {
      previewContainer.innerHTML += `
        <div class="ticket-preview flex items-center justify-center text-gray-500">
          <div class="text-center">
            <div class="text-2xl mb-2">...</div>
            <div>و ${tickets.length - 6} تذاكر أخرى</div>
          </div>
        </div>
      `;
    }
    
    document.getElementById('previewArea').classList.remove('hidden');
  }

  updatePreview() {
    if (document.getElementById('previewArea').classList.contains('hidden')) {
      return;
    }
    this.previewTickets();
  }

  printTickets() {
    const startNumber = parseInt(document.getElementById('startNumber').value);
    const endNumber = parseInt(document.getElementById('endNumber').value);
    const columns = parseInt(document.getElementById('columns').value);
    
    if (!this.selectedClinic) {
      alert('يرجى اختيار عيادة أولاً');
      return;
    }
    
    if (!startNumber || !endNumber || startNumber > endNumber) {
      alert('يرجى إدخال أرقام صحيحة');
      return;
    }
    
    const tickets = this.generateTickets(startNumber, endNumber);
    const printArea = document.getElementById('printArea');
    const ticketGrid = document.getElementById('ticketGrid');
    
    // Set grid columns
    ticketGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    
    // Generate tickets HTML
    ticketGrid.innerHTML = '';
    tickets.forEach(ticket => {
      const ticketDiv = document.createElement('div');
      ticketDiv.className = 'ticket';
      ticketDiv.innerHTML = this.createTicketPrintHTML(ticket);
      ticketGrid.appendChild(ticketDiv);
    });
    
    // Show print area and print
    printArea.classList.remove('hidden');
    
    setTimeout(() => {
      window.print();
      printArea.classList.add('hidden');
    }, 100);
  }

  createTicketPrintHTML(ticket) {
    const waitingPatients = Math.max(0, ticket.number - ticket.currentNumber);
    const fontSize = document.getElementById('fontSize').value;
    
    return `
      <div style="font-weight: bold; font-size: ${fontSize * 1.2}px; margin-bottom: 8px; line-height: 1.2;">
        ${ticket.clinicName}
      </div>
      <div style="font-size: ${fontSize * 2}px; font-weight: bold; color: #1f2937; margin-bottom: 8px; line-height: 1;">
        ${ticket.number}
      </div>
      <div style="margin-bottom: 2px; font-size: ${fontSize * 0.9}px;">
        <span style="color: #6b7280;">الحالي:</span> ${ticket.currentNumber}
      </div>
      <div style="margin-bottom: 2px; font-size: ${fontSize * 0.9}px;">
        <span style="color: #6b7280;">المنتظرون:</span> ${waitingPatients}
      </div>
      <div style="margin-bottom: 2px; font-size: ${fontSize * 0.9}px;">
        <span style="color: #6b7280;">الوقت المتوقع:</span> ${ticket.waitingTime} دقيقة
      </div>
      <div style="font-size: ${fontSize * 0.7}px; color: #9ca3af; margin-top: 4px;">
        ${ticket.date} ${ticket.time}
      </div>
    `;
  }
}

// Initialize tickets manager
const ticketsManager = new TicketsManager();