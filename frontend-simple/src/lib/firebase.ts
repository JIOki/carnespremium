import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Inicializar Firebase
 */
export function initializeFirebase(): FirebaseApp {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

/**
 * Obtener instancia de Firebase Messaging
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  try {
    // Verificar si el navegador soporta notificaciones
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.warn('Firebase Messaging no está soportado en este navegador');
      return null;
    }

    if (!messaging) {
      const app = initializeFirebase();
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.error('Error inicializando Firebase Messaging:', error);
    return null;
  }
}

/**
 * Solicitar permiso de notificaciones y obtener token FCM
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Solicitar permiso al usuario
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    // Obtener el token FCM
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('NEXT_PUBLIC_FIREBASE_VAPID_KEY no configurado');
      return null;
    }

    const currentToken = await getToken(messaging, { vapidKey });

    if (currentToken) {
      console.log('Token FCM obtenido:', currentToken);
      return currentToken;
    } else {
      console.log('No se pudo obtener el token FCM');
      return null;
    }

  } catch (error) {
    console.error('Error obteniendo permiso de notificaciones:', error);
    return null;
  }
}

/**
 * Escuchar mensajes en primer plano
 */
export async function onMessageListener(): Promise<any> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    return Promise.reject('Messaging no inicializado');
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Mensaje recibido en primer plano:', payload);
      resolve(payload);
    });
  });
}

/**
 * Verificar si las notificaciones están habilitadas
 */
export function areNotificationsEnabled(): boolean {
  return Notification.permission === 'granted';
}

/**
 * Verificar estado del permiso de notificaciones
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  return Notification.permission;
}

export { firebaseConfig };
