import type { AdaptationConfig, UserProfile } from '../shared/types.js';

export function buildAdaptationConfig(profile: UserProfile): AdaptationConfig {
  const modules = [
    { key: 'chatbot', title: 'Chatbot', visible: profile.activeModules.includes('chatbot'), priority: 1 },
    { key: 'notifications', title: 'Mensajes', visible: profile.activeModules.includes('notifications'), priority: 2 },
    { key: 'uploads', title: 'Archivos', visible: profile.activeModules.includes('uploads'), priority: 3 },
    { key: 'logs', title: 'Logs', visible: profile.activeModules.includes('logs'), priority: 4 },
    { key: 'diagnostics', title: 'Diagnóstico', visible: profile.preferences.showDiagnostics, priority: 5 }
  ];

  return {
    userId: profile.id,
    modules,
    uiTone: profile.preferences.preferredTone === 'formal' ? 'technical' : 'calm',
    showProactiveMessages: true,
    messagesEndpoint: `/api/messages/${profile.id}`
  };
}
