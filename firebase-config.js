// Firebase Configuration Template
// أنشئ نسخة من هذا الملف وسمه firebase-config.js
// ثم أضف بياناتك من Firebase Console

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfijcUylFDUZ5v-52lI4lX2VLL5eaTjtw",
  authDomain: "queue5-161f6.firebaseapp.com",
  databaseURL: "https://queue5-161f6-default-rtdb.firebaseio.com",
  projectId: "queue5-161f6",
  storageBucket: "queue5-161f6.firebasestorage.app",
  messagingSenderId: "676053788162",
  appId: "1:676053788162:web:d8c57e8d9b6d453230a91b",
  measurementId: "G-9DW4EYP6RE"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Database References
const database = firebase.database();
const centersRef = database.ref('centers');
const clinicsRef = database.ref('clinics');
const callsRef = database.ref('calls');
const settingsRef = database.ref('settings');

// Initialize default data
function initializeDatabase() {
    // Initialize center
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
    
    // Initialize sample clinics
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
    
    // Set default data
    centersRef.child('main').set(defaultCenter);
    clinicsRef.set(defaultClinics);
    
    console.log("Database initialized successfully");
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        database,
        centersRef,
        clinicsRef,
        callsRef,
        settingsRef,
        initializeDatabase
    };
}
