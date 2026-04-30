import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { embedWhirlpoolQuestion } from '../server/supabase.js';

async function run() {
  const url = process.env.SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

  const content = `Manual: Si la lavadora Whirlpool no enciende, revisa la alimentación, la tapa y el bloqueo de controles.`;
  console.log('Generating embedding for sample document...');
  const embedding = await embedWhirlpoolQuestion(content);
  console.log('Embedding length:', embedding.length);

  console.log('Inserting sample document into kb_documents...');
  const { data, error } = await admin.from('kb_documents').insert([{
    content,
    metadata: { source: 'ingest-test' },
    embedding
  }]).select('*');

  if (error) {
    console.error('Insert error:', error.message);
    process.exit(1);
  }

  console.log('Inserted:', data);
}

run().catch(err => { console.error('Fatal error:', err); process.exit(1); });
