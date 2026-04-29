import { findBestWhirlpoolManualMatch, getKbDocumentsByFileName } from '../supabase.ts';

async function main() {
  const query = process.argv[2] ?? '¿Cómo cambio al modo oscuro?';
  console.log('[test_match] Consulta:', query);
  try {
    try {
      const match = await findBestWhirlpoolManualMatch(query);
      console.log('[test_match] Resultado (RPC match):', JSON.stringify(match, null, 2));
      return;
    } catch (rpcErr) {
      console.warn('[test_match] RPC match failed:', rpcErr instanceof Error ? rpcErr.message : String(rpcErr));
    }

    // Fallback: listar documentos por file_name
    const docs = await getKbDocumentsByFileName('info_plataforma.txt');
    console.log('[test_match] Documentos encontrados para info_plataforma.txt:', JSON.stringify(docs, null, 2));
  } catch (err) {
    console.error('[test_match] Error:', err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

void main();
