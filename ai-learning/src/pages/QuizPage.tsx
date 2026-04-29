import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getQuizByLesson, createAttempt, finishAttempt, processUserRewards } from '../lib/quizService';
import { getCourseDetail } from '../lib/courseService';
import { supabase } from '../lib/supabaseClient';

interface Option {
  id: string;
  texto: string;
  esCorrecta: boolean;
}

interface Question {
  id: string;
  texto: string;
  orden: number;
  opciones: Option[];
}

interface Leccion {
  id: string;
  titulo: string;
}

interface RespuestaData {
  preguntaId: string;
  opcionId: string;
  esCorrecta: boolean;
}

export default function QuizPage({ user }: { user: any }) {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();

  const [loading, setLoading] = useState(true);
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);
  const [leccion, setLeccion] = useState<Leccion | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [respuestas, setRespuestas] = useState<RespuestaData[]>([]);

  const [isFinished, setIsFinished] = useState(false);
  const [finalPercentage, setFinalPercentage] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;

    async function initializeQuiz() {
      try {
        // 1. Cargar quiz
        const data = await getQuizByLesson(lessonId!);
        if (!data) throw new Error('No existe quiz para esta lección');

        setLeccion(data.leccion);
        setQuestions(data.preguntas);

        // 2. Crear intento
        const attempt = await createAttempt(user.id, lessonId!, data.quizId);
        setAttemptId(attempt.id);

        // 3. Obtener courseId para saber la lección siguiente
        const { data: lessonRow } = await supabase
          .from('lessons')
          .select('course_id')
          .eq('id', lessonId)
          .maybeSingle();

        const resolvedId = lessonRow?.course_id ?? null;
        setResolvedCourseId(resolvedId);

        if (resolvedId) {
          const course = await getCourseDetail(resolvedId, user.id);
          const lessons: any[] = course?.lessons ?? [];
          const currentIndex = lessons.findIndex((l) => String(l.id) === String(lessonId));
          if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
            setNextLessonId(String(lessons[currentIndex + 1].id));
          }
        }
      } catch (err) {
        console.error('Error cargando quiz:', err);
      } finally {
        setLoading(false);
      }
    }

    initializeQuiz();
  }, [lessonId, user]); // ✅ courseId eliminado — ya no existe como variable

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  const handleNext = async () => {
    if (selectedOption === null || !currentQuestion) return;

    const selectedOp = currentQuestion.opciones[selectedOption];
    const respuestaData: RespuestaData = {
      preguntaId: currentQuestion.id,
      opcionId: selectedOp.id,
      esCorrecta: selectedOp.esCorrecta,
    };

    const updatedAnswers = [...respuestas, respuestaData];
    setRespuestas(updatedAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      await finalizeQuiz(updatedAnswers);
    }
  };

  const finalizeQuiz = async (allAnswers: RespuestaData[]) => {
    try {
      const result = await finishAttempt(attemptId, allAnswers);
      const percentage = result.porcentaje;

      let xp = 0;
      const badges: string[] = [];

      if (percentage === 100) { xp = 100; badges.push('Perfeccionista'); }
      else if (percentage >= 85) { xp = 60; badges.push('Excelencia'); }
      else if (percentage >= 70) { xp = 40; }

      if (xp > 0 || badges.length > 0) {
        await processUserRewards(user.id, resolvedCourseId, xp, badges);
      }

      setFinalPercentage(percentage);
      setXpEarned(xp);
      setUnlockedBadges(badges);
      setIsFinished(true);
    } catch (err) {
      console.error('Error finalizando quiz:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin block mx-auto mb-4">
            progress_activity
          </span>
          <p className="text-slate-500 font-medium">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  if (!leccion || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-10 text-center">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
          <span className="material-symbols-outlined text-4xl text-red-400 block mx-auto mb-4">quiz</span>
          <p className="text-red-500 font-bold mb-4">No hay quiz disponible para esta lección.</p>
          <button
            onClick={() => navigate(resolvedCourseId ? `/courses/${resolvedCourseId}` : '/courses')}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-bold"
          >
            Volver al curso
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto p-6 lg:p-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-primary">
              {finalPercentage >= 70 ? 'workspace_premium' : 'sentiment_dissatisfied'}
            </span>
          </div>

          <h2 className="text-3xl font-black text-on-surface mb-2">
            {finalPercentage >= 70 ? '¡Quiz completado!' : 'Necesitas reforzar el módulo'}
          </h2>
          <p className="text-slate-500 mb-8">
            Resultado en <span className="font-bold text-primary">{leccion.titulo}</span>
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Puntaje</p>
              <p className="text-3xl font-black text-primary">{finalPercentage}%</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">XP Ganada</p>
              <p className="text-3xl font-black text-accent-blue">+{xpEarned}</p>
            </div>
          </div>

          {unlockedBadges.length > 0 && (
            <div className="mb-8 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-sm font-bold text-amber-700 mb-2">Logro desbloqueado</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {unlockedBadges.map((badge) => (
                  <span key={badge} className="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {nextLessonId && (
              <button
                onClick={() => navigate(`/lesson/${nextLessonId}`)}
                className="flex-1 py-4 rounded-2xl bg-accent-blue text-white font-bold"
              >
                Módulo Siguiente
              </button>
            )}
            <button
              onClick={() => navigate(resolvedCourseId ? `/courses/${resolvedCourseId}` : '/courses')}
              className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold"
            >
              Volver al Curso
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold"
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
      <div className="flex flex-col sm:flex-row justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-on-surface">
            {leccion.titulo}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
            Pregunta {currentQuestionIndex + 1} de {questions.length}
          </p>
        </div>
        <div className="w-full sm:w-48 h-2 rounded-full bg-slate-100 overflow-hidden self-start sm:self-end">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent-blue"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-100 shadow-xl"
            >
              <p className="text-xl font-bold text-on-surface mb-8">
                {currentQuestion.texto}
              </p>

              <div className="space-y-4">
                {currentQuestion.opciones.map((option, idx) => (
                  <div
                    key={option.id}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                      selectedOption === idx
                        ? 'border-accent-blue bg-blue-50'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedOption === idx ? 'border-accent-blue' : 'border-slate-300'
                    }`}>
                      {selectedOption === idx && (
                        <div className="w-3 h-3 rounded-full bg-accent-blue" />
                      )}
                    </div>
                    <span className={`font-medium ${
                      selectedOption === idx ? 'text-primary font-bold' : 'text-slate-600'
                    }`}>
                      {option.texto}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={selectedOption === null}
                  className={`px-10 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all ${
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
          </AnimatePresence>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">
              Recompensas
            </h4>
            <ul className="space-y-3 text-sm font-medium text-slate-600">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-base">emoji_events</span>
                100 XP por 100% de aciertos
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500 text-base">star</span>
                60 XP por más de 85%
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500 text-base">check_circle</span>
                40 XP por más de 70%
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500 text-base">workspace_premium</span>
                Insignia por perfección
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}