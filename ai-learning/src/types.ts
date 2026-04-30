export type UserRole = 'user' | 'content-admin' | 'super-admin';

export interface Badge {
  id: string;
  name: string;
  description: string;
  dateEarned?: string;
  icon?: string;
}

export interface CompletedCourseSummary {
  id: string;
  title: string;
  thumbnail: string;
  completedAt: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar: string;
  area: string;
  gender: 'M' | 'F' | 'Other';
  score: number;
  badges: Badge[];
  completedCourses: string[];
  completedCoursesDetailed: CompletedCourseSummary[];
  pendingCourses: string[];
  streak: number;
  lastActivityDate?: string;
  completedQuizzesCount: number;
  savedPrompts: string[];
  needsOnboarding?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  area: string;
  progress: number;
  isNew?: boolean;
  duration: string;
  level: 'Básico' | 'Intermedio' | 'Avanzado';
  externalLinks: {
    type: 'pdf' | 'slides' | 'sheets' | 'video';
    url: string;
    label: string;
  }[];
  modules: CourseModule[];
}

export interface CourseModuleResource {
  id: string;
  type: 'pdf' | 'video';
  label: string;
  url: string;
}

export interface CourseModuleQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface CourseModuleQuiz {
  id: string;
  title: string;
  questions: CourseModuleQuizQuestion[];
}

export interface CourseModule {
  id: string;
  title: string;
  completed: boolean;
  duration: string;
  resources?: CourseModuleResource[];
  quiz?: CourseModuleQuiz;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  area: string;
  impact: string;
  tags: string[];
  likes: number;
  usageCount: number;
  category: 'Productividad' | 'Ingeniería' | 'Marketing' | 'Finanzas' | 'HR';
}

export interface Metric {
  area: string;
  count: number;
  abandonmentRate: number;
  avgTimeSpent: number;
  engagement: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  completionRate: number;
  avgScore: number;
  usersByArea: { name: string; value: number }[];
  adoptionTrend: { date: string; users: number }[];
}