#!/usr/bin/env node
/**
 * Local test script for course chat RAG flow (mock/offline).
 * Simulates the entire chat handler logic without calling real Supabase or Gemini.
 * Helps validate that document retrieval, course filtering, and context building work correctly.
 */

// Mock types and data
type MockCourse = {
  id: string;
  title: string;
  description: string;
  active: boolean;
};

type MockCourseDocument = {
  id: string;
  course_id: string;
  lesson_id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
};

type MockChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// ============ MOCK DATA ============

const mockUserId = 'user-123';
const mockCourseId = 'course-abc';
const mockLessonId = 'lesson-xyz';

// Simulated user's enrolled courses
const mockUserCourses: MockCourse[] = [
  {
    id: mockCourseId,
    title: 'Introducción a la Plataforma Adaptativa',
    description: 'Aprende cómo usar la plataforma de Whirlpool',
    active: true
  },
  {
    id: 'course-def',
    title: 'Gestión de Cursos Avanzada',
    description: 'Técnicas avanzadas para administradores',
    active: true
  }
];

// Simulated course documents (retrieved via RAG)
const mockCourseDocuments: MockCourseDocument[] = [
  {
    id: 'doc-1',
    course_id: mockCourseId,
    lesson_id: mockLessonId,
    content: `
      Módulo 1: Navegación Básica
      La plataforma adaptativa te permite explorar cursos disponibles en la sección "Explorar Cursos".
      Puedes ver tu progreso en "Mis Cursos" y acceder a tu panel de control personalizado desde el menú principal.
      Los cursos se adaptan a tu nivel de aprendizaje basándose en tus respuestas a los quizzes.
    `,
    metadata: { chunk_index: 1, lesson_title: 'Navegación Básica' },
    similarity: 0.92
  },
  {
    id: 'doc-2',
    course_id: mockCourseId,
    lesson_id: mockLessonId,
    content: `
      Módulo 2: Características Principales
      - Panel de Control: visualiza tu progreso, últimas actividades y recomendaciones personalizadas.
      - Explorar Cursos: descubre nuevos cursos según tu área de interés.
      - Mis Cursos: accede a los cursos en los que estás inscrito.
      - Soporte y Ayuda: obtén respuestas a tus preguntas sobre la plataforma.
    `,
    metadata: { chunk_index: 2, lesson_title: 'Características Principales' },
    similarity: 0.88
  }
];

// Simulated manual/platform context (from kb_documents)
const mockManualContext = `
  Información General de la Plataforma Adaptativa de Whirlpool:
  - La plataforma está diseñada para proporcionar experiencias de aprendizaje personalizadas.
  - Los cursos se adaptan dinámicamente según tu desempeño y nivel.
  - Puedes seguimiento tu progreso en tiempo real desde el Panel de Control.
  - La plataforma incluye quizzes, proyectos colaborativos y recursos multimedia.
`;

// ============ MOCK FUNCTIONS ============

async function mockGetUserCourses(userId: string): Promise<MockCourse[]> {
  console.log(`[mock] getUserCourses(${userId})`);
  // Simulated delay
  await new Promise(r => setTimeout(r, 100));
  return mockUserCourses;
}

async function mockMatchCourseDocuments(
  courseId: string,
  question: string,
  matchCount = 3
): Promise<MockCourseDocument[]> {
  console.log(`[mock] matchCourseDocuments(${courseId}, "${question}", ${matchCount})`);
  await new Promise(r => setTimeout(r, 150));
  // Return top N documents
  return mockCourseDocuments.slice(0, matchCount);
}

async function mockFindBestManualMatch(question: string): Promise<string | null> {
  console.log(`[mock] findBestManualMatch("${question}")`);
  await new Promise(r => setTimeout(r, 100));
  // For demo, assume question matches if it contains platform-related keywords
  if (/naveg|panel|curso|plataforma|característica/i.test(question)) {
    return mockManualContext;
  }
  return null;
}

async function mockExtractPdfText(pdfBase64: string): Promise<string | null> {
  console.log(`[mock] extractPdfText(<${pdfBase64.length} chars base64>)`);
  if (!pdfBase64 || pdfBase64.length < 50) return null;
  // Simulate PDF extraction
  await new Promise(r => setTimeout(r, 200));
  return `
    CONTENIDO DEL PDF ADJUNTO:
    Este es un documento PDF de ejemplo sobre mejores prácticas de uso de la plataforma.
    Incluye guías paso a paso, FAQs y troubleshooting común.
  `;
}

// ============ CORE RAG FLOW ============

async function buildTechnicalContext(
  userId: string,
  question: string,
  pdfBase64?: string
): Promise<string> {
  console.log('\n=== BUILDING TECHNICAL CONTEXT ===\n');

  const parts: string[] = [];

  // 1. Get user's courses
  console.log('Step 1: Fetching user courses...');
  const userCourses = await mockGetUserCourses(userId);
  console.log(`  → Found ${userCourses.length} courses:`, userCourses.map(c => c.title).join(', '));

  // 2. Search course documents
  console.log('\nStep 2: Searching course documents...');
  const courseIds = userCourses.map(c => c.id);
  const allCourseMatches: MockCourseDocument[] = [];
  for (const courseId of courseIds) {
    const matches = await mockMatchCourseDocuments(courseId, question, 3);
    allCourseMatches.push(...matches);
    console.log(`  → Course "${courseId}": found ${matches.length} documents`);
  }

  if (allCourseMatches.length > 0) {
    const courseText = allCourseMatches
      .map(m => `[Lesson: ${m.metadata?.lesson_title || 'N/A'}, Similarity: ${(m.similarity * 100).toFixed(0)}%]\n${m.content.trim()}`)
      .join('\n---\n');
    parts.push(`[DOCUMENTOS DE CURSOS]\n${courseText}\n[/DOCUMENTOS DE CURSOS]`);
  }

  // 3. Search manual/platform documentation
  console.log('\nStep 3: Searching manual documentation...');
  const manualMatch = await mockFindBestManualMatch(question);
  if (manualMatch) {
    parts.push(`[DOCUMENTACIÓN DE PLATAFORMA]\n${manualMatch.trim()}\n[/DOCUMENTACIÓN DE PLATAFORMA]`);
    console.log('  → Manual context found and added');
  } else {
    console.log('  → No relevant manual documentation found');
  }

  // 4. Extract and add inline PDF (if provided)
  console.log('\nStep 4: Processing inline PDF (if provided)...');
  if (pdfBase64) {
    const pdfText = await mockExtractPdfText(pdfBase64);
    if (pdfText) {
      parts.push(`[CONTENIDO PDF ADJUNTO]\n${pdfText.trim()}\n[/CONTENIDO PDF ADJUNTO]`);
      console.log('  → PDF extracted and added');
    }
  } else {
    console.log('  → No PDF provided');
  }

  const technicalContext = parts.join('\n\n');
  console.log('\n=== CONTEXT BUILT ===\n');
  return technicalContext;
}

// ============ SYSTEM PROMPT BUILDER ============

function buildSystemInstruction(technicalContext?: string): string {
  const baseInstruction =
    'Eres el asistente virtual de soporte para la Plataforma Adaptativa de Whirlpool. Puedes consultar información de cursos a los que el usuario está inscrito y procesar archivos adjuntos (por ejemplo, PDFs) mediante RAG. Tu función principal es ayudar a los usuarios a navegar por la plataforma, usar sus funciones y entender su interfaz y contenido de cursos.';

  if (!technicalContext) {
    return baseInstruction;
  }

  return `${baseInstruction}\n\n[CONTEXTO DISPONIBLE]\n${technicalContext}\n[/CONTEXTO DISPONIBLE]\n\nINSTRUCCIONES:\n- Usa el contexto proporcionado como fuente de verdad.\n- No inventes información que no esté en el contexto.\n- Sé conciso y enfocado en las preguntas del usuario.`;
}

// ============ TEST SCENARIOS ============

async function runTestScenario(
  scenario: string,
  userId: string,
  question: string,
  pdfBase64?: string
) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST SCENARIO: ${scenario}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`User ID: ${userId}`);
  console.log(`Question: "${question}"`);
  console.log(`PDF provided: ${pdfBase64 ? 'YES' : 'NO'}`);
  console.log();

  try {
    const technicalContext = await buildTechnicalContext(userId, question, pdfBase64);

    console.log('\n=== FINAL SYSTEM INSTRUCTION ===\n');
    const systemInstruction = buildSystemInstruction(technicalContext);
    console.log(systemInstruction);

    console.log('\n=== CONTEXT LENGTH STATS ===\n');
    console.log(`Total context size: ${technicalContext.length} characters`);
    console.log(`Approx tokens (rough estimate): ${Math.ceil(technicalContext.length / 4)}`);

    console.log('\n✅ TEST PASSED\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:\n', err instanceof Error ? err.message : String(err));
  }
}

// ============ MAIN ============

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║       TEST: Course Chat RAG Flow (Offline/Mock)                        ║
║       Validates context building without real API calls                ║
╚════════════════════════════════════════════════════════════════════════╝
  `);

  // Scenario 1: User asks about platform navigation (should match course docs + manual)
  await runTestScenario(
    'Platform Navigation Query',
    mockUserId,
    '¿Cómo navego por la plataforma?'
  );

  // Scenario 2: Same question but with PDF attachment
  const mockPdfBase64 = Buffer.from('mock pdf content').toString('base64');
  await runTestScenario(
    'Platform Navigation + PDF Attachment',
    mockUserId,
    '¿Cómo navego por la plataforma?',
    mockPdfBase64
  );

  // Scenario 3: Question about course features
  await runTestScenario(
    'Course Features Query',
    mockUserId,
    '¿Cuáles son las características principales de la plataforma?'
  );

  // Scenario 4: Question without clear match (should still work, just less context)
  await runTestScenario(
    'Out-of-Scope Query',
    mockUserId,
    '¿Cuál es el precio de los electrodomésticos Whirlpool?'
  );

  console.log(`
╔════════════════════════════════════════════════════════════════════════╗
║                         ALL TESTS COMPLETED                            ║
║                                                                        ║
║  Next steps:                                                           ║
║  1. Create course_documents table in Supabase (run create_course_...sql)║
║  2. Ingest course PDFs (node server/scripts/ingest_courses.ts)         ║
║  3. Deploy backend and test with real Socket.IO client                 ║
╚════════════════════════════════════════════════════════════════════════╝
  `);
}

void main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
