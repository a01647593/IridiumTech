import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_QUIZZES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const quizId = queryParams.get('id') || 'q1';
  
  const quiz = MOCK_QUIZZES.find(q => q.id === quizId) || MOCK_QUIZZES[0];
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleNext = () => {
    if (selectedOption === null) return;

    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    const finalScore = (score + (selectedOption === currentQuestion.correctAnswer ? 1 : 0)) / quiz.questions.length * 100;
    let xp = 0;
    const newBadges: string[] = [];

    // Gamification Logic
    if (finalScore === 100) {
      xp += 100;
      // Check for Perfeccionista (simulated check)
      // In a real app we would check user.completedQuizzesCount
    } else if (finalScore >= 85) {
      xp += 60;
    } else if (finalScore >= 70) {
      xp += 40;
    }

    // Badge logic (simulated for demo)
    if (finalScore === 100) {
      newBadges.push('Perfeccionista');
    }

    setXpEarned(xp);
    setUnlockedBadges(newBadges);
    setIsFinished(true);
  };

  if (isFinished) {
    const finalPercentage = (score / quiz.questions.length) * 100;
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
          <p className="text-slate-500 mb-8">Has completado el quiz: <span className="font-bold text-primary">{quiz.title}</span></p>
          
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
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all"
            >
              Volver al Dashboard
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
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">{quiz.title}</h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">
            Pregunta {currentQuestionIndex + 1} de {quiz.questions.length}
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
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl"
            >
              <p className="text-lg sm:text-xl font-semibold text-on-surface mb-6 sm:mb-8">
                {currentQuestion.question}
              </p>
              <div className="space-y-4">
                {currentQuestion.options.map((option, idx) => (
                  <div 
                    key={idx}
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
                      {option}
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
                  {currentQuestionIndex === quiz.questions.length - 1 ? 'Finalizar' : 'Siguiente'} 
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </motion.div>
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
