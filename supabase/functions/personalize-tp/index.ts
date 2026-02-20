import Anthropic from 'npm:@anthropic-ai/sdk@0.36';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { personaLabel, storylineName, talkingPoints, customerContext } = await req.json();

    const client = new Anthropic();

    const prompt = `Je bent een ervaren sales consultant bij delaware, een SAP-implementatiepartner.

Personaliseer de volgende strategische talking points voor een gesprek met ${customerContext.companyName}.
Persona: ${personaLabel}
Storyline: ${storylineName}
${customerContext.extraInfo ? `Extra context: ${customerContext.extraInfo}` : ''}

Originele talking points:
${Array.isArray(talkingPoints) ? talkingPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') : talkingPoints}

Geef ${Array.isArray(talkingPoints) ? talkingPoints.length : 3} gepersonaliseerde talking points terug die specifiek aansluiten bij de situatie van ${customerContext.companyName}.
Houd de punten bondig (max 2 zinnen per punt) en actionable.
Antwoord als JSON array: { "talkingPoints": ["punt 1", "punt 2", ...] }`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
