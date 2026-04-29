import { supabase } from './supabaseClient';

export async function getQuizByLesson(lessonId) {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select(`
      id,
      title
    `)
    .eq('lesson_id', lessonId)
    .single();

  if (quizError) throw new Error(quizError.message);
  if (!quiz) return null;

  const { data: questions, error: questionError } = await supabase
    .from('questions')
    .select(`
      id,
      question_text,
      type,
      answers (
        id,
        answer_text,
        is_correct
      )
    `)
    .eq('quiz_id', quiz.id);

  if (questionError) throw new Error(questionError.message);

  const normalizedQuestions = (questions || []).map((q, idx) => ({
    id: q.id,
    texto: q.question_text,
    orden: idx + 1,
    opciones: (q.answers || []).map((a) => ({
      id: a.id,
      texto: a.answer_text,
      esCorrecta: a.is_correct,
    })),
  }));

  return {
    quizId: quiz.id,
    leccion: {
      id: lessonId,
      titulo: quiz.title || 'Quiz',
    },
    preguntas: normalizedQuestions,
  };
}

export async function createAttempt(userId, lessonId, quizId) {
  const { data, error } = await supabase
    .from('attempts')
    .insert({
      user_id: userId,
      lesson_id: lessonId,
      quiz_id: quizId,
      score: 0,
      lives_left: 3,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function finishAttempt(attemptId, respuestasSeleccionadas = []) {
  if (!attemptId) return { porcentaje: 0 };

  let correctCount = 0;

  const rowsToInsert = respuestasSeleccionadas.map((r) => {
    if (r.esCorrecta) correctCount++;

    return {
      attempt_id: attemptId,
      question_id: r.preguntaId,
      answer_id: r.opcionId,
      is_correct: r.esCorrecta,
    };
  });

  if (rowsToInsert.length > 0) {
    const { error: answerError } = await supabase
      .from('attempt_answers')
      .insert(rowsToInsert);

    if (answerError) throw new Error(answerError.message);
  }

  const porcentaje = Math.round((correctCount / respuestasSeleccionadas.length) * 100);

  const { error: updateError } = await supabase
    .from('attempts')
    .update({
      score: porcentaje,
      completed_at: new Date().toISOString(),
      lives_left: 3 - (respuestasSeleccionadas.length - correctCount),
    })
    .eq('id', attemptId);

  if (updateError) throw new Error(updateError.message);

  return { porcentaje };
}

export async function processUserRewards(userId, courseId, xpEarned, badgeNames = []) {
  // 1. Guardar la XP en xp_logs
  if (xpEarned > 0) {
    const { error: xpError } = await supabase
      .from('xp_logs')
      .insert({
        user_id: userId,
        course_id: courseId, // Puede ser null si es un quiz independiente
        action: 'quiz_completed',
        xp: xpEarned
      });

    if (xpError) console.error('Error insertando XP:', xpError.message);
  }

  // 2. Otorgar los logros/badges en user_achievements
  if (badgeNames.length > 0) {
    // Primero, buscamos los IDs reales de los logros usando sus nombres
    const { data: achievements, error: fetchErr } = await supabase
      .from('achievements')
      .select('id, name')
      .in('name', badgeNames);

    if (fetchErr) {
      console.error('Error buscando logros:', fetchErr.message);
      return;
    }

    if (achievements && achievements.length > 0) {
      const recordsToInsert = achievements.map(ach => ({
        user_id: userId,
        achievement_id: ach.id,
        unlocked_at: new Date().toISOString()
      }));

      // Usamos upsert para no duplicar el logro si el usuario repite el quiz
      const { error: achError } = await supabase
        .from('user_achievements')
        .upsert(recordsToInsert, { onConflict: 'user_id,achievement_id' });

      if (achError) console.error('Error asignando logro:', achError.message);
    }
  }
}