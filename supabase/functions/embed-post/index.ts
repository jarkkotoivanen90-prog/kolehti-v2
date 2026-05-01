import OpenAI from "npm:openai";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

Deno.serve(async (req) => {
  const { post_id, content } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SERVICE_ROLE_KEY")!
  );

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: content,
  });

  const vector = embedding.data[0].embedding;

  await supabase.from("post_embeddings").upsert({
    post_id,
    embedding: vector,
  });

  return new Response(JSON.stringify({ ok: true }));
});
