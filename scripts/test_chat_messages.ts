import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testChatMessages() {
  console.log('=== Testing Chat Messages Insert + Query ===\n');

  // Test user ID
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  try {
    // 1. Insert test user message
    console.log('1. Inserting test user message...');
    const { data: userMsgData, error: userMsgError } = await adminClient
      .from('chat_messages')
      .insert({
        user_id: testUserId,
        role: 'user',
        content: '¿Cómo reseteo mi lavadora Whirlpool?',
      })
      .select();

    if (userMsgError) {
      console.error('Error inserting user message:', userMsgError);
      return;
    }
    console.log('✓ User message inserted:', userMsgData?.[0]?.id);

    // 2. Insert test assistant message
    console.log('\n2. Inserting test assistant message...');
    const { data: assistantMsgData, error: assistantMsgError } = await adminClient
      .from('chat_messages')
      .insert({
        user_id: testUserId,
        role: 'assistant',
        content: 'Para resetear tu lavadora, sigue estos pasos: 1) Apágala, 2) Presiona los botones según el manual, 3) Enciéndela de nuevo.',
      })
      .select();

    if (assistantMsgError) {
      console.error('Error inserting assistant message:', assistantMsgError);
      return;
    }
    console.log('✓ Assistant message inserted:', assistantMsgData?.[0]?.id);

    // 3. Query all messages for this user
    console.log('\n3. Querying all messages for user...');
    const { data: allMessages, error: queryError } = await adminClient
      .from('chat_messages')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: true });

    if (queryError) {
      console.error('Error querying messages:', queryError);
      return;
    }

    console.log(`✓ Retrieved ${allMessages?.length || 0} messages:\n`);
    allMessages?.forEach((msg, idx) => {
      console.log(`  [${idx + 1}] Role: ${msg.role}`);
      console.log(`      Content: ${msg.content.substring(0, 60)}...`);
      console.log(`      Created: ${msg.created_at}\n`);
    });

    console.log('=== Test Completed Successfully ===');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testChatMessages();
