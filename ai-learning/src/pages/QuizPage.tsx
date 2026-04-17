import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_QUIZZES } from '../constants';
import { getStoredCourseById } from '../lib/courseStore.ts';

interface Option {
  id: number;
  preguntaId: number;
  texto: string;
  esCorrecta: boolean;
  explicacion: string;
}

interface Question {
  id: number;
  texto: string;
  orden: number;
  opciones: Option[];
}

interface Leccion {
  id: string | number;
  titulo: string;
  orden: number;
  fechaLimite: string;
  cursoId: string | number;
  cursoTitulo: string;
}

// Mapeo de módulos (m1, m2, m3, m4) a quizzes (q1, q2, q3, q4)
const MODULE_TO_QUIZ_MAP: Record<string, string> = {
  'm1': 'q1',
  'm2': 'q2',
  'm3': 'q3',
  'm4': 'q4',
  '1': 'q1',
  '2': 'q2',
  '3': 'q3',
  '4': 'q4',
};

// Función para convertir quiz del formato MOCK_QUIZZES al formato esperado
const normalizeQuiz = (mockQuiz: any, moduleId: string): { leccion: Leccion; preguntas: Question[] } => {
  const orden = parseInt(moduleId.replace('m', '') || '1');
  const leccion: Leccion = {
    id: orden || 1,
    titulo: mockQuiz.title || 'Quiz',
    orden: orden,
    fechaLimite: '2024-12-31',
    cursoId: 1,
    cursoTitulo: 'Advanced Neural Architectures - Whirlpool'
  };

  const preguntas: Question[] = mockQuiz.questions.map((q: any, idx: number) => ({
    id: q.id ? parseInt(String(q.id)) : idx + 1,
    texto: q.question,
    orden: idx + 1,
    opciones: q.options.map((opt: string, optIdx: number) => ({
      id: optIdx + 1,
      preguntaId: q.id ? parseInt(String(q.id)) : idx + 1,
      texto: opt,
      esCorrecta: optIdx === q.correctAnswer,
      explicacion: `Opción ${optIdx === q.correctAnswer ? 'correcta' : 'incorrecta'}`
    }))
  }));

  return { leccion, preguntas };
};

const normalizeStoredQuiz = (
  quiz: { title: string; questions: Array<{ id: string; question: string; options: string[]; correctAnswer: number }> },
  module: { id: string; title: string },
  course: { id: string; title: string }
): { leccion: Leccion; preguntas: Question[] } => {
  const leccion: Leccion = {
    id: module.id,
    titulo: quiz.title || `Quiz - ${module.title}`,
    orden: 1,
    fechaLimite: '2026-12-31',
    cursoId: course.id,
    cursoTitulo: course.title,
  };

  const preguntas: Question[] = quiz.questions.map((question, idx) => ({
    id: idx + 1,
    texto: question.question,
    orden: idx + 1,
    opciones: question.options.slice(0, 4).map((option, optIdx) => ({
      id: optIdx + 1,
      preguntaId: idx + 1,
      texto: option,
      esCorrecta: optIdx === question.correctAnswer,
      explicacion: `Opción ${optIdx === question.correctAnswer ? 'correcta' : 'incorrecta'}`,
    })),
  }));

  return { leccion, preguntas };
};

// Función helper para obtener el mock quiz
const getMockQuiz = (leccionId: string | null): { leccion: Leccion; preguntas: Question[] } => {
  // Mapear leccionId a quizId
  const quizId = leccionId ? MODULE_TO_QUIZ_MAP[leccionId] || 'q1' : 'q1';
  
  // Encontrar el quiz en MOCK_QUIZZES
  const mockQuiz = MOCK_QUIZZES.find(q => q.id === quizId) || MOCK_QUIZZES[0];
  
  // Normalizar y retornar
  return normalizeQuiz(mockQuiz, leccionId || 'm1');
};

// Mock Quiz - Fallback mientras se crean otros
const MOCK_QUIZ: { leccion: Leccion; preguntas: Question[] } = {
  leccion: {
    id: 1,
    titulo: 'Quiz de Prueba - Whirlpool',
    orden: 1,
    fechaLimite: '2024-12-31',
    cursoId: 1,
    cursoTitulo: 'Curso Demo'
  },
  preguntas: [
    {
      id: 1,
      texto: '¿En qué año fue fundada Whirlpool Corporation?',
      orden: 1,
      opciones: [
        { id: 1, preguntaId: 1, texto: '1911', esCorrecta: true, explicacion: 'Whirlpool fue fundada en 1911 como The Upton Machine Company' },
        { id: 2, preguntaId: 1, texto: '1920', esCorrecta: false, explicacion: 'Whirlpool se fundó antes de 1920' },
        { id: 3, preguntaId: 1, texto: '1925', esCorrecta: false, explicacion: 'Whirlpool se fundó antes de 1925' },
        { id: 4, preguntaId: 1, texto: '1905', esCorrecta: false, explicacion: 'Whirlpool se fundó después de 1905' },
        { id: 5, preguntaId: 1, texto: '1930', esCorrecta: false, explicacion: 'Whirlpool se fundó antes de 1930' }
      ]
    },
    {
      id: 2,
      texto: '¿Cuál es el principal enfoque de innovación de Whirlpool en electrodomésticos inteligentes?',
      orden: 2,
      opciones: [
        { id: 6, preguntaId: 2, texto: 'Conectividad IoT y control remoto', esCorrecta: true, explicacion: 'Whirlpool se enfoca en electrodomésticos conectados con control remoto e inteligencia artificial' },
        { id: 7, preguntaId: 2, texto: 'Solo reducir precios', esCorrecta: false, explicacion: 'Whirlpool enfatiza innovación tecnológica además de precios competitivos' },
        { id: 8, preguntaId: 2, texto: 'Eliminar todas las características', esCorrecta: false, explicacion: 'Whirlpool agrega características, no las elimina' },
        { id: 9, preguntaId: 2, texto: 'Cambiar colores únicamente', esCorrecta: false, explicacion: 'Whirlpool innova en tecnología, no solo en estética' },
        { id: 10, preguntaId: 2, texto: 'Aumentar tamaño de productos', esCorrecta: false, explicacion: 'Whirlpool optimiza tamaño y espacio eficientemente' }
      ]
    },
    {
      id: 3,
      texto: '¿Qué tecnología de IA utiliza Whirlpool en su plataforma GIT Labs para el aprendizaje?',
      orden: 3,
      opciones: [
        { id: 11, preguntaId: 3, texto: 'Google Gemini y LLMs generativos', esCorrecta: true, explicacion: 'Whirlpool utiliza Google Gemini y otros modelos de lenguaje en su plataforma GIT Labs' },
        { id: 12, preguntaId: 3, texto: 'Solo análisis de datos básico', esCorrecta: false, explicacion: 'GIT Labs ofrece mucho más que análisis básico' },
        { id: 13, preguntaId: 3, texto: 'No utiliza IA', esCorrecta: false, explicacion: 'GIT Labs está completamente basada en tecnología de IA' },
        { id: 14, preguntaId: 3, texto: 'Solo reconocimiento de imágenes', esCorrecta: false, explicacion: 'GIT Labs usa múltiples tecnologías de IA, va más allá de imágenes' },
        { id: 15, preguntaId: 3, texto: 'Algoritmos de los años 2000', esCorrecta: false, explicacion: 'GIT Labs utiliza tecnología de IA moderna y generativa' }
      ]
    }
  ]
};

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const leccionId = queryParams.get('leccionId') || queryParams.get('moduleId') || queryParams.get('id');
  const courseId = queryParams.get('courseId');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [sesionId, setSesionId] = useState<number | null>(null);
  const [respuestas, setRespuestas] = useState<any[]>([]);
  const [finalPercentage, setFinalPercentage] = useState(0);
  const [nextLeccion, setNextLeccion] = useState<Leccion | null>(null);

  useEffect(() => {
    const initializeQuiz = async () => {
      try {
        // Prioridad 1: quiz creado en Gestión de Contenido para el módulo actual
        if (courseId && leccionId) {
          const storedCourse = getStoredCourseById(courseId);
          const storedModule = storedCourse?.modules?.find((module) => String(module.id) === String(leccionId));

          if (storedCourse && storedModule?.quiz && storedModule.quiz.questions.length > 0) {
            const storedQuiz = normalizeStoredQuiz(
              storedModule.quiz,
              { id: String(storedModule.id), title: storedModule.title },
              { id: String(storedCourse.id), title: storedCourse.title }
            );
            setLeccion(storedQuiz.leccion);
            setQuestions(storedQuiz.preguntas);
            setSesionId(null);
            setLoading(false);
            return;
          }
        }

        const userId = localStorage.getItem('userId');
        
        // Si no hay leccionId, usar mock quiz
        if (!leccionId) {
          const mockData = getMockQuiz(leccionId);
          setLeccion(mockData.leccion);
          setQuestions(mockData.preguntas);
          setSesionId(null); // Sin sesión en mock
          setLoading(false);
          return;
        }

        // Intentar cargar desde la API
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }

        const res = await fetch(`/api/quiz/iniciar?leccionId=${leccionId}&userId=${userId}`);
        if (!res.ok) {
          throw new Error('Error al cargar la lección');
        }
        const data = await res.json();
        setLeccion(data.leccion);
        setQuestions(data.preguntas || []);
        setSesionId(data.sesionId);
        setLoading(false);
      } catch (err) {
        // En caso de error, usar mock quiz como fallback
        console.warn('Usando mock quiz como fallback:', err);
        const mockData = getMockQuiz(leccionId);
        setLeccion(mockData.leccion);
        setQuestions(mockData.preguntas);
        setSesionId(null);
        setLoading(false);
      }
    };

    initializeQuiz();
  }, [leccionId]);

  // Cargar módulo siguiente
  useEffect(() => {
    const fetchNextLeccion = () => {
      if (!leccion || !courseId) return;

      const storedCourse = getStoredCourseById(courseId);
      const modules = storedCourse?.modules ?? [];
      const currentIdx = modules.findIndex((module) => String(module.id) === String(leccion.id));

      if (currentIdx !== -1 && currentIdx < modules.length - 1) {
        const nextModule = modules[currentIdx + 1];
        setNextLeccion({
          id: nextModule.id,
          titulo: nextModule.title,
          orden: currentIdx + 2,
          fechaLimite: '2026-12-31',
          cursoId: courseId,
          cursoTitulo: storedCourse?.title ?? '',
        });
      } else {
        setNextLeccion(null);
      }
    };
    
    fetchNextLeccion();
  }, [leccion, courseId]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleNext = async () => {
    if (selectedOption === null || !currentQuestion) return;

    const selectedOp = currentQuestion.opciones[selectedOption];
    const respuestaData = {
      preguntaId: currentQuestion.id,
      opcionId: selectedOp.id,
      esCorrecta: selectedOp.esCorrecta
    };

    if (selectedOp.esCorrecta) {
      setScore(prev => prev + 1);
    }

    setRespuestas([...respuestas, respuestaData]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      await finalizeQuiz([...respuestas, respuestaData]);
    }
  };

  const finalizeQuiz = async (allRespuestas: any[]) => {
    try {
      // Calcular porcentaje
      const correctAnswers = allRespuestas.filter((r: any) => r.esCorrecta).length;
      const calculatedPercentage = (correctAnswers / questions.length) * 100;
      
      let xp = 0;
      const newBadges: string[] = [];

      if (calculatedPercentage === 100) {
        xp += 100;
        newBadges.push('Perfeccionista');
      } else if (calculatedPercentage >= 85) {
        xp += 60;
        newBadges.push('Excelencia');
      } else if (calculatedPercentage >= 70) {
        xp += 40;
      }

      // Si hay sesionId, guardar en API
      if (sesionId) {
        try {
          const saveRes = await fetch('/api/quiz/responder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sesionId,
              respuestas: allRespuestas.map(r => ({
                preguntaId: r.preguntaId,
                opcionId: r.opcionId
              }))
            })
          });

          if (!saveRes.ok) {
            console.warn('No se pudieron guardar respuestas en la API');
          }
        } catch (err) {
          console.warn('Error guardando en API:', err);
        }
      }

      // Registrar progreso real del curso al completar leccion/quiz
      const leccionIdNum = Number(leccionId);
      const courseIdNum = Number(courseId);
      if (Number.isFinite(leccionIdNum) && Number.isFinite(courseIdNum)) {
        try {
          await fetch('/api/lessons/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leccionId: leccionIdNum,
              cursoId: courseIdNum,
            }),
          });
        } catch (err) {
          console.warn('No se pudo registrar progreso de leccion:', err);
        }
      }

      setXpEarned(xp);
      setUnlockedBadges(newBadges);
      setFinalPercentage(Math.round(calculatedPercentage));
      setIsFinished(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al finalizar';
      console.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button 
            onClick={() => navigate('/courses')} 
            className="bg-primary text-white px-6 py-2 rounded-lg hover:scale-105 transition-all"
          >
            Volver a Cursos
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto p-6 lg:p-12 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-10 shadow-2xl border border-slate-100"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-primary">
              {finalPercentage >= 70 ? 'workspace_premium' : 'sentiment_dissatisfied'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-on-surface mb-2">
            {finalPercentage >= 70 ? '¡Felicidades!' : 'Sigue intentándolo'}
          </h2>
          <p className="text-slate-500 mb-8">
            Has completado: <span className="font-bold text-primary">{leccion?.titulo}</span>
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Puntaje</p>
              <p className="text-3xl font-black text-primary">{Math.round(finalPercentage)}%</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">XP Ganada</p>
              <p className="text-3xl font-black text-accent-blue">+{xpEarned}</p>
            </div>
          </div>

          {unlockedBadges.length > 0 && (
            <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-amber-800 font-bold text-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-amber-500">military_tech</span>
                ¡Nuevo Logro Desbloqueado!
              </p>
              <div className="flex justify-center gap-2 mt-2">
                {unlockedBadges.map(b => (
                  <span key={b} className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {nextLeccion && (
              <button 
                onClick={() => navigate(`/lesson?courseId=${courseId}&moduleId=${nextLeccion.id}`)}
                className="flex-1 bg-accent-blue text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
              >
                Módulo Siguiente
              </button>
            )}
            <button 
              onClick={() => navigate('/courses')}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
            >
              Volver a Cursos
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              Reintentar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-12">
      <div className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-10 gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
            {leccion?.titulo || 'Quiz'}
          </h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>
        <div className="w-full sm:w-48 h-2 bg-slate-100 rounded-full overflow-hidden self-start sm:self-end">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent-blue rounded-full"
          ></motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {currentQuestion && (
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl"
            >
              <p className="text-lg sm:text-xl font-semibold text-on-surface mb-6 sm:mb-8">
                {currentQuestion.texto}
              </p>
              <div className="space-y-4">
                {currentQuestion.opciones?.map((option: Option, idx: number) => (
                  <div 
                    key={option.id}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-4 sm:p-5 border-2 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${
                      selectedOption === idx 
                      ? 'bg-blue-50 border-accent-blue shadow-md' 
                      : 'bg-slate-50 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedOption === idx ? 'border-accent-blue' : 'border-slate-300'
                    }`}>
                      {selectedOption === idx && <div className="w-3 h-3 rounded-full bg-accent-blue"></div>}
                    </div>
                    <span className={`text-sm sm:text-md ${selectedOption === idx ? 'font-bold text-primary' : 'font-medium text-slate-600'}`}>
                      {option.texto}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-8 sm:mt-12 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={selectedOption === null}
                  className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                    selectedOption === null 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-primary text-white hover:scale-105'
                  }`}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Finalizar' : 'Siguiente'} 
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Recompensas del Quiz</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <span className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold">100</span>
                XP por 100% de aciertos
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">60</span>
                XP por más de 85%
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <span className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-sm">military_tech</span>
                </span>
                Insignia por Perfección
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
