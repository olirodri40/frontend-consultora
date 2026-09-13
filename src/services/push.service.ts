import api from './api';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function activarNotificaciones(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Tu navegador no soporta notificaciones push');
    return false;
  }

  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') {
    return false;
  }

  const registration = await navigator.serviceWorker.ready;

  const { data } = await api.get('/push/vapid-public-key');
  const publicKey = data.publicKey;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await api.post('/push/suscribir', subscription.toJSON());
  return true;
}

export async function verificarSuscripcion(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}

export async function desactivarNotificaciones(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await api.post('/push/desuscribir', { endpoint: subscription.endpoint });
    await subscription.unsubscribe();
  }
}