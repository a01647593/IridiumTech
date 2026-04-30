import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { getRecentChatMessages, findBestWhirlpoolManualMatch, embedWhirlpoolQuestion } from '../server/supabase.js';

async function run() {
  const question = process.argv.slice(2).join(' ') || 'Mi lavadora Whirlpool no enciende';
  const userId = process.env.TEST_USER_ID || '11111111-1111-1111-1111-111111111111';

  console.log('Question:', question);

  const memory = await getRecentChatMessages(userId, 5);
  console.log('Memory messages:', memory.length);

  let technicalContext = '';
  try {
    const match = await findBestWhirlpoolManualMatch(question);
    console.log('Best manual match:', match ? (match.id ?? '<no-id>') : 'none');
    technicalContext = match?.content ?? '';
  } catch (err) {
    console.warn('Could not run match_documents (embedding/RPC) — continuing without technical context:', err instanceof Error ? err.message : String(err));
    technicalContext = '';
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.error('Missing GEMINI_API_KEY');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const model = process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview';

  const systemInstruction = `Eres el Asistente Experto de Whirlpool México. Responde en español, breve y útil.\nContexto técnico: ${technicalContext}`;

  const contents = [
    ...memory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: question }] }
  ];

  console.log('Calling Gemini...');
  const resp = await ai.models.generateContent({ model, contents, config: { systemInstruction } });
  console.log('Gemini reply:', resp.text?.slice(0, 1000));
}

run().catch(err => {
  console.error('Error running RAG test:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
