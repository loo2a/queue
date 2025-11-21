# نظام نداء وانتظار المرضى - ملفات التنفيذ

## ملفات النظام

### الصفحات الرئيسية
- `index.html` - الصفحة الرئيسية والدليل
- `admin.html` - لوحة الإدارة
- `display.html` - شاشة العرض
- `control.html` - صفحة التحكم
- `tickets.html` - طباعة التذاكر

### ملفات JavaScript
- `admin.js` - منطق صفحة الإدارة
- `display.js` - منطق صفحة العرض
- `control.js` - منطق صفحة التحكم
- `tickets.js` - منطق طباعة التذاكر
- `audio-system.js` - نظام الصوت والنطق

### ملفات التكوين
- `firebase-config-template.js` - نموذج تكوين Firebase

## خطوات التثبيت

### 1. إعداد Firebase
1. أنشئ مشروع في [Firebase Console](https://console.firebase.google.com/)
2. فعّل Realtime Database
3. احصل على بيانات التكوين من إعدادات المشروع
4. أنشئ ملف `firebase-config.js` بناءً على `firebase-config-template.js`

### 2. تعديل ملفات HTML
في كل ملف HTML (admin.html, display.html, control.html, tickets.html)، استبدل:
```javascript
// Firebase Configuration Template
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_AUTH_DOMAIN_HERE",
    databaseURL: "YOUR_DATABASE_URL_HERE",
    projectId: "YOUR_PROJECT_ID_HERE",
    storageBucket: "YOUR_STORAGE_BUCKET_HERE",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
    appId: "YOUR_APP_ID_HERE"
};
```

ببياناتك الفعلية من Firebase.

### 3. رفع الملفات
1. أنشئ repository جديد على GitHub
2. رفع جميع الملفات إلى الrepository
3. فعّل GitHub Pages من الإعدادات
4. اختر branch `main` ومجلد `/root`

## الاستخدام

### أول مرة
1. افتح صفحة الإدارة (`admin.html`)
2. أضف العيادات المطلوبة
3. اختر إعدادات الصوت
4. احفظ الإعدادات

### التشغيل اليومي
1. شاشة العرض: `display.html`
2. صفحة التحكم: `control.html`
3. طباعة التذاكر: `tickets.html`

## المميزات
- واجهة عربية كاملة
- نظام صوتي متقدم
- إدارة متعددة العيادات
- طباعة تذاكر مخصصة
- نداء طوارئ
- شاشة عرض مع ميديا
- QR Code للدخول

## المساعدة
لأي مشاكل أو أسئلة، راجع ملف README.md الرئيسي في المجلد الأصلي.