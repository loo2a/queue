// Firebase Configuration Template
// أنشئ نسخة من هذا الملف وسمه firebase-config.js
// ثم أضف بياناتك من Firebase Console

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN_HERE",
    databaseURL: "YOUR_DATABASE_URL_HERE",
    projectId: "YOUR_PROJECT_ID_HERE",
    storageBucket: "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE"
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