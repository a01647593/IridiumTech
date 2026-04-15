import type { MessageRecord, UserProfile } from '../shared/types.js';

function buildDeviceSummary(profile: UserProfile): string {
  const active = profile.whirlpoolDevices.map((device) => `${device.name} (${device.status})`).join(', ');
  return active || 'sin dispositivos activos';
}

export function generateChatbotReply(input: string, profile: UserProfile): Pick<MessageRecord, 'title' | 'content' | 'severity'> {
  const normalized = input.trim().toLowerCase();

  if (normalized.includes('estado') || normalized.includes('status')) {
    return {
      title: 'Estado del sistema',
      content: `Veo ${buildDeviceSummary(profile)}. Si quieres, puedo resumirte alertas, tiempos estimados y acciones recomendadas.`,
      severity: 'info'
    };
  }

  if (normalized.includes('archivo') || normalized.includes('upload') || normalized.includes('cargar')) {
    return {
      title: 'Carga de archivos',
      content: 'Puedes subir imágenes, documentos o reportes. Yo registraré el archivo y lo dejaré disponible para el flujo del reto.',
      severity: 'success'
    };
  }

  if (normalized.includes('filtro') || normalized.includes('mantenimiento')) {
    return {
      title: 'Mantenimiento recomendado',
      content: 'El filtro de agua ya cruzó el umbral de uso. Conviene registrar la orden de cambio y mostrar esta alerta en la UI.',
      severity: 'warning'
    };
  }

  if (normalized.includes('mensaje') || normalized.includes('notificación') || normalized.includes('notificacion')) {
    return {
      title: 'Mensajería activa',
      content: 'Los eventos de Whirlpool se convierten en notificaciones persistentes para que el usuario no pierda contexto.',
      severity: 'info'
    };
  }

  return {
    title: 'Asistente Whirlpool',
    content: 'Puedo responder preguntas del reto, interpretar eventos de Whirlpool y mostrar avisos proactivos en tiempo real.',
    severity: 'info'
  };
}
