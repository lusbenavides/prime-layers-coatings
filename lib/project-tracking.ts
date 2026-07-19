import type { ProjectStatus } from '@/types/database';

const SITE = 'https://www.primelayercoating.com';

export function getTrackUrl(accessToken: string) {
  return `${SITE}/track/${accessToken}`;
}

export const TRACK_STEPS: {
  status: ProjectStatus;
  labelEn: string;
  labelEs: string;
  descriptionEn: string;
  descriptionEs: string;
  icon: string;
}[] = [
  {
    status: 'scheduled',
    labelEn: 'Starting Soon',
    labelEs: 'Próximo a iniciar',
    descriptionEn: 'Your project is on our schedule. We will arrive on the agreed date.',
    descriptionEs: 'Su proyecto está en nuestro calendario. Llegaremos en la fecha acordada.',
    icon: '📅',
  },
  {
    status: 'in_progress',
    labelEn: 'In Progress',
    labelEs: 'En proceso',
    descriptionEn: 'Our team is actively working on your project.',
    descriptionEs: 'Nuestro equipo está trabajando activamente en su proyecto.',
    icon: '🎨',
  },
  {
    status: 'finishing',
    labelEn: 'Final Touches',
    labelEs: 'Últimos retoques',
    descriptionEn: 'Almost done! We are applying the final details and quality check.',
    descriptionEs: '¡Casi listo! Estamos dando los últimos retoques y revisión de calidad.',
    icon: '✨',
  },
  {
    status: 'completed',
    labelEn: 'Complete',
    labelEs: 'Completado',
    descriptionEn: 'Your project is finished. Thank you for choosing Prime Layer Coatings!',
    descriptionEs: '¡Su proyecto está terminado! Gracias por elegir Prime Layer Coatings.',
    icon: '✅',
  },
];

export function getStepIndex(status: ProjectStatus) {
  if (status === 'cancelled') return -1;
  const order: ProjectStatus[] = ['scheduled', 'in_progress', 'finishing', 'completed'];
  return order.indexOf(status);
}

export function buildStatusSms(
  status: ProjectStatus,
  clientName: string,
  projectTitle: string,
  trackUrl: string
) {
  const name = clientName.split(' ')[0] || clientName;
  const messages: Partial<Record<ProjectStatus, string>> = {
    scheduled: `Hi ${name}! Prime Layer Coatings: Your project "${projectTitle}" is scheduled. Track progress here: ${trackUrl}`,
    in_progress: `Hi ${name}! We've started work on "${projectTitle}". See live updates: ${trackUrl}`,
    finishing: `Hi ${name}! Almost done — final touches on "${projectTitle}". ${trackUrl}`,
    completed: `Hi ${name}! Your project "${projectTitle}" is complete! Thank you for trusting Prime Layer Coatings. ${trackUrl}`,
  };
  return messages[status] ?? `Prime Layer Coatings update for "${projectTitle}": ${trackUrl}`;
}

export function buildWelcomeSms(clientName: string, projectTitle: string, trackUrl: string) {
  const name = clientName.split(' ')[0] || clientName;
  return `Hi ${name}! Welcome to Prime Layer Coatings. Your project "${projectTitle}" is confirmed. Track every step here: ${trackUrl}`;
}

export function buildNewLeadSms(name: string, phone: string, projectType: string) {
  return `🎨 New lead: ${name} · ${phone} · ${projectType}. Check your CRM dashboard.`;
}
