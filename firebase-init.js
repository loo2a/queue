// Firebase Initialization and Common Functions

// Check if Firebase is already initialized
if (!window.firebaseInitialized) {
    // Initialize Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    window.firebaseInitialized = true;
}

// Common database references
const database = firebase.database();
const centersRef = database.ref('centers');
const clinicsRef = database.ref('clinics');
const callsRef = database.ref('calls');
const settingsRef = database.ref('settings');
const emergencyRef = database.ref('emergency');
const displayRef = database.ref('display');

// Initialize default data if not exists
function initializeDefaultData() {
    // Check if center exists
    centersRef.child('main').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const defaultCenter = {
                name: "مركز طبي متطور",
                settings: {
                    ttsSpeed: 1.0,
                    audioType: "tts",
                    audioPath: "./audio",
                    mediaPath: "./media",
                    newsText: "مرحباً بكم في مركزنا الطبي - نسعى لتقديم أفضل خدمة طبية لكم",
                    displayDateTime: true,
                    displayQRCode: true,
                    alertDuration: 5000
                }
            };
            
            centersRef.child('main').set(defaultCenter);
        }
    });
    
    // Check if clinics exist
    clinicsRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            const defaultClinics = {
                clinic1: {
                    name: "عيادة طب الأسرة",
                    number: 1,
                    password: "1234",
                    currentNumber: 0,
                    lastCalled: null,
                    status: "active",
                    color: "#3B82F6",
                    totalServed: 0
                },
                clinic2: {
                    name: "عيادة الباطنة",
                    number: 2,
                    password: "1234",
                    currentNumber: 0,
                    lastCalled: null,
                    status: "active",
                    color: "#10B981",
                    totalServed: 0
                },
                clinic3: {
                    name: "عيادة الأطفال",
                    number: 3,
                    password: "1234",
                    currentNumber: 0,
                    lastCalled: null,
                    status: "active",
                    color: "#F59E0B",
                    totalServed: 0
                }
            };
            
            clinicsRef.set(defaultClinics);
        }
    });
}

// Call this function when page loads
initializeDefaultData();