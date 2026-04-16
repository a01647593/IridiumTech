import { Course, Prompt, Metric, Quiz, Badge, AdminStats } from './types';

export const MOCK_BADGES: Badge[] = [
  { id: '1', name: 'AI Pioneer', icon: 'rocket_launch', description: 'Completó su primer curso de IA.' },
  { id: '2', name: 'Fast Learner', icon: 'bolt', description: 'Terminó un curso en menos de 72 horas.' },
  { id: '3', name: 'Perfeccionista', icon: 'star', description: 'Obtuvo 100% en 5 exámenes.' },
  { id: '4', name: 'Top 3', icon: 'emoji_events', description: 'Estuvo en el top 3 del ranking semanal.' },
  { id: '5', name: 'Chambeador', icon: 'work', description: 'Completó 3 cursos completos.' },
  { id: '6', name: '7 Días de Racha', icon: 'local_fire_department', description: '7 días de actividad consecutiva.' }
];

export const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Advanced Neural Architectures - Whirlpool',
    description: 'Explora estructuras profundas desde Transformers hasta GANs aplicadas a manufactura en Whirlpool.',
    thumbnail: 'https://picsum.photos/seed/course1/600/400',
    category: 'Ingeniería',
    area: 'Ingeniería',
    progress: 0,
    duration: '6h 30m',
    level: 'Avanzado',
    externalLinks: [
      { type: 'pdf', label: 'Guía de Arquitectura Whirlpool', url: '#' },
      { type: 'slides', label: 'Presentación Módulo 1', url: '#' }
    ],
    modules: [
      { id: 'm1', title: 'Introducción a Transformers', completed: false, duration: '45m' },
      { id: 'm2', title: 'Mecanismos de Atención', completed: false, duration: '1h' },
      { id: 'm3', title: 'GANs y Modelos Generativos', completed: false, duration: '1h 30m' },
      { id: 'm4', title: 'Optimización de Hiperparámetros', completed: false, duration: '2h' }
    ]
  }
];

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    courseId: '1',
    title: 'Quiz: Fundamentos de Arquitecturas',
    questions: [
      {
        id: '1',
        question: '¿Cuál de los siguientes términos describe mejor la capacidad de un modelo de lenguaje para generar texto coherente basándose en un contexto previo?',
        options: ['Fine-tuning supervisado', 'Inferencia Autoregresiva', 'Backpropagation', 'Gradient Descent'],
        correctAnswer: 1
      },
      {
        id: '2',
        question: '¿Qué componente es fundamental en la arquitectura Transformer para manejar dependencias a larga distancia?',
        options: ['Capas Convolucionales', 'Mecanismo de Atención (Self-Attention)', 'Pooling Global', 'Dropout'],
        correctAnswer: 1
      },
      {
        id: '3',
        question: '¿Cuál es el propósito principal de las GANs?',
        options: ['Clasificar imágenes', 'Generar nuevos datos similares a los de entrenamiento', 'Reducir la dimensionalidad', 'Optimizar bases de datos'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'q2',
    courseId: '1',
    title: 'Quiz: Mecanismos de Atención Avanzados',
    questions: [
      {
        id: '1',
        question: '¿Cuántas capas de atención hay en los Transformers estándar?',
        options: ['2', '4', '6', '12'],
        correctAnswer: 2
      },
      {
        id: '2',
        question: '¿Cuál es la complejidad temporal del mecanismo Self-Attention?',
        options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(n³)'],
        correctAnswer: 2
      },
      {
        id: '3',
        question: '¿Qué permite el Multi-Head Attention en los Transformers?',
        options: ['Procesar múltiples muestras en paralelo', 'Atender a diferentes representaciones del mismo contexto', 'Aumentar el tamaño del batch', 'Reducir memoria'],
        correctAnswer: 1
      },
      {
        id: '4',
        question: '¿Cuál es el propósito del Positional Encoding en los Transformers?',
        options: ['Normalizar los pesos', 'Proporcionar información sobre el orden de las palabras', 'Reducir overfitting', 'Acelerar convergencia'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'q3',
    courseId: '1',
    title: 'Quiz: GANs y Generación de Datos',
    questions: [
      {
        id: '1',
        question: '¿Cuál es el componente generador en una GAN?',
        options: ['Lee datos reales y los clasifica', 'Crea datos sintéticos a partir de ruido', 'Optimiza los hiperparámetros', 'Evalúa la precisión del modelo'],
        correctAnswer: 1
      },
      {
        id: '2',
        question: '¿Cuál es el rol del discriminador en una GAN?',
        options: ['Generar nuevas imágenes', 'Distinguir entre datos reales y sintéticos', 'Comprimir datos', 'Entrenar el generador'],
        correctAnswer: 1
      },
      {
        id: '3',
        question: 'En el contexto de GANs, ¿qué es el "Nash Equilibrium"?',
        options: ['El punto donde el discriminador siempre acepta el generador', 'El punto de convergencia donde ambas redes alcanzan rendimiento óptimo', 'La máxima precisión del discriminador', 'La salida del generador'],
        correctAnswer: 1
      },
      {
        id: '4',
        question: '¿Cuál es un desafío común en el entrenamiento de GANs?',
        options: ['Falta de datos de entrenamiento', 'Mode collapse', 'Complejidad lineal', 'Kernels insuficientes'],
        correctAnswer: 1
      },
      {
        id: '5',
        question: '¿Qué es el "Mode Collapse" en GANs?',
        options: ['Fallos del sistema', 'Cuando el generador aprende a generar solo una variedad limitada de muestras', 'Pérdida de memoria', 'Overflow del discriminador'],
        correctAnswer: 1
      }
    ]
  },
  {
    id: 'q4',
    courseId: '1',
    title: 'Quiz: Optimización de Hiperparámetros',
    questions: [
      {
        id: '1',
        question: '¿Cuál es el hiperparámetro más crítico al entrenar modelos profundos?',
        options: ['Batch size', 'Learning rate', 'Número de capas', 'Función de activación'],
        correctAnswer: 1
      },
      {
        id: '2',
        question: '¿Qué es el "Learning Rate Scheduling"?',
        options: ['Aumentar el learning rate cada época', 'Ajustar dinámicamente el learning rate durante el entrenamiento', 'Fijar el learning rate en un valor constante', 'Eliminar el learning rate'],
        correctAnswer: 1
      },
      {
        id: '3',
        question: '¿Cuál es la técnica de regularización más común para evitar overfitting?',
        options: ['Batch Normalization', 'L1/L2 Regularization', 'Dropout', 'Todas las anteriores'],
        correctAnswer: 3
      },
      {
        id: '4',
        question: '¿Qué hace el momentum en algoritmos de optimización como SGD?',
        options: ['Acelera la convergencia acumulando gradientes previos', 'Normaliza los datos', 'Aumenta el batch size', 'Reduce la precisión'],
        correctAnswer: 0
      },
      {
        id: '5',
        question: '¿Cuál es la principal ventaja del Adaptive Learning Rate (Adam) sobre SGD estándar?',
        options: ['Es más rápido siempre', 'Se adapta automáticamente a diferentes escalas de características', 'Nunca sufre de overfitting', 'Requiere menos datos'],
        correctAnswer: 1
      },
      {
        id: '6',
        question: '¿Cómo se relaciona el batch size con la convergencia del modelo?',
        options: ['Batch size más grande = siempre mejor convergencia', 'Batch size más pequeño = gradientes más estables', 'Batch size más grande = gradientes más estables pero convergencia más lenta', 'No hay relación'],
        correctAnswer: 2
      }
    ]
  }
];

export const MOCK_PROMPTS: Prompt[] = [
  {
    id: '1',
    title: 'Auditoría de Código Cloud',
    description: 'Prompt estructurado para revisar seguridad y costes en terraform AWS para Whirlpool Cloud.',
    content: 'Actúa como un experto en DevOps y revisa el siguiente código de Terraform para asegurar que cumple con los estándares de Whirlpool...',
    author: 'm.garcia@whirlpool.com',
    area: 'Ingeniería',
    impact: 'Ahorro del 15% en costos de infraestructura.',
    tags: ['Terraform', 'AWS', 'Costes'],
    likes: 24,
    usageCount: 156,
    category: 'Ingeniería'
  },
  {
    id: '2',
    title: 'Resumen de Reportes Financieros',
    description: 'Extrae KPIs clave de reportes trimestrales complejos para el equipo de Finanzas.',
    content: 'Analiza este PDF y extrae el EBITDA, margen operativo y flujo de caja siguiendo el formato corporativo de Whirlpool...',
    author: 'j.perez@whirlpool.com',
    area: 'Finanzas',
    impact: 'Reducción de 2 horas en análisis manual por reporte.',
    tags: ['Finanzas', 'KPIs', 'Reportes'],
    likes: 18,
    usageCount: 89,
    category: 'Finanzas'
  },
  {
    id: '3',
    title: 'Generador de Copys para Campañas',
    description: 'Crea variaciones de anuncios para redes sociales manteniendo el tono de marca Whirlpool.',
    content: 'Genera 5 variaciones de copy para una campaña de lavadoras inteligentes, enfocándote en la durabilidad y tecnología...',
    author: 'l.rodriguez@whirlpool.com',
    area: 'Marketing',
    impact: 'Aumento del 20% en CTR de campañas digitales.',
    tags: ['Marketing', 'Copywriting', 'Social Media'],
    likes: 42,
    usageCount: 312,
    category: 'Marketing'
  }
];

export const MOCK_METRICS: Metric[] = [
  { area: 'Ingeniería', count: 1250, abandonmentRate: 4.2, avgTimeSpent: 480, engagement: 92 },
  { area: 'Marketing', count: 850, abandonmentRate: 11.5, avgTimeSpent: 310, engagement: 78 },
  { area: 'Finanzas', count: 620, abandonmentRate: 7.8, avgTimeSpent: 295, engagement: 85 },
  { area: 'Recursos Humanos', count: 450, abandonmentRate: 14.2, avgTimeSpent: 160, engagement: 65 },
  { area: 'Ventas', count: 980, abandonmentRate: 9.1, avgTimeSpent: 410, engagement: 88 },
  { area: 'Operaciones', count: 1100, abandonmentRate: 5.5, avgTimeSpent: 440, engagement: 90 }
];

export const MOCK_ADMIN_STATS: AdminStats = {
  totalUsers: 5250,
  activeUsers: 3840,
  completionRate: 68.5,
  avgScore: 84,
  usersByArea: [
    { name: 'Ingeniería', value: 1250 },
    { name: 'Operaciones', value: 1100 },
    { name: 'Ventas', value: 980 },
    { name: 'Marketing', value: 850 },
    { name: 'Finanzas', value: 620 },
    { name: 'HR', value: 450 }
  ],
  adoptionTrend: [
    { date: '2024-01', users: 1200 },
    { date: '2024-02', users: 1800 },
    { date: '2024-03', users: 2500 },
    { date: '2024-04', users: 3200 },
    { date: '2024-05', users: 4100 },
    { date: '2024-06', users: 5250 }
  ]
};
