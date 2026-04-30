-- SQL: create table for vectorized course documents (pgvector)
-- Replace <EMBEDDING_DIM> with your embedding dimension (e.g. 1536 or 3072).

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Adjust the dimension to match your embedding model.
-- You can set EMBEDDING_DIM in your deployment and replace it here before running.
-- Example: set EMBEDDING_DIM=3072

CREATE TABLE IF NOT EXISTS course_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid,
  lesson_id uuid,
  user_id uuid,
  content text,
  embedding vector(768),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- An ivfflat index is recommended for performance on large vector collections.
-- Tune the lists parameter for your dataset (e.g. 100).
CREATE INDEX IF NOT EXISTS course_documents_embedding_idx ON course_documents USING ivfflat (embedding) WITH (lists = 100);

-- Indexes to support filtering by course_id and user_id
CREATE INDEX IF NOT EXISTS course_documents_course_id_idx ON course_documents (course_id);
CREATE INDEX IF NOT EXISTS course_documents_user_id_idx ON course_documents (user_id);

-- Example query to perform similarity search (replace :query_embedding with array)
-- SELECT id, content, metadata, embedding <-> :query_embedding AS similarity
-- FROM course_documents
-- WHERE course_id = '...'
-- ORDER BY embedding <-> :query_embedding
-- LIMIT 5;

-- RPC: match_course_documents
-- Performs similarity search on course_documents filtered by course_id (and optionally user_id).
-- Returns top `match_count` results sorted by similarity (distance).
CREATE OR REPLACE FUNCTION match_course_documents(
  query_embedding vector(768),
  course_id_param uuid,
  match_count int DEFAULT 5,
  user_id_param uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  course_id uuid,
  lesson_id uuid,
  content text,
  metadata jsonb,
  similarity real
) LANGUAGE sql STABLE AS $$
  SELECT
    course_documents.id,
    course_documents.course_id,
    course_documents.lesson_id,
    course_documents.content,
    course_documents.metadata,
    (1 - (course_documents.embedding <=> query_embedding)) as similarity
  FROM course_documents
  WHERE
    course_documents.course_id = course_id_param
    AND (user_id_param IS NULL OR course_documents.user_id = user_id_param)
  ORDER BY course_documents.embedding <=> query_embedding
  LIMIT match_count;
$$;
