// functions/compare/[slug].ts
// Cloudflare Pages Function - generates unknown comparisons via Gemini API (with KV caching)

const KNOWN_COMPARISONS = [
  'iphone-16-pro-vs-samsung-galaxy-s25',
  'macbook-pro-vs-dell-xps-15',
  'chatgpt-vs-claude-ai',
  'bitcoin-vs-ethereum',
  'toyota-camry-vs-honda-accord',
  'japan-vs-thailand-travel',
  'netflix-vs-disney-plus',
  'tesla-model-3-vs-bmw-i4',
];

const AI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-pro'];

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  let lastError: unknown;

  for (const model of AI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192, responseMimeType: 'application/json' },
        }),
      });
      if (!response.ok) throw new Error(`Gemini API ${response.status}`);
      const data = await response.json() as any;
      const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
      if (text.trim()) return text;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All models failed');
}

function generateHTML(entityA: string, entityB: string, data: any): string {
  const specs = data.specs || [];
  const specsHTML = specs.map((spec: any) => {
    const badge = spec.winner === 'a'
      ? '<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600">A</span>'
      : spec.winner === 'b'
        ? '<span style="background:#ede9fe;color:#5b21b6;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600">B</span>'
        : '<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600">Tie</span>';
    return `<tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-weight:500">${spec.label}</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#475569">${spec.valueA}</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;color:#475569">${spec.valueB}</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:center">${badge}</td></tr>`;
  }).join('');
  const prosA = (data.prosA || []).map((p: string) => `<li style="display:flex;gap:8px;color:#475569"><span style="color:#22c55e">+</span><span>${p}</span></li>`).join('');
  const consA = (data.consA || []).map((c: string) => `<li style="display:flex;gap:8px;color:#475569"><span style="color:#ef4444">-</span><span>${c}</span></li>`).join('');
  const prosB = (data.prosB || []).map((p: string) => `<li style="display:flex;gap:8px;color:#475569"><span style="color:#22c55e">+</span><span>${p}</span></li>`).join('');
  const consB = (data.consB || []).map((c: string) => `<li style="display:flex;gap:8px;color:#475569"><span style="color:#ef4444">-</span><span>${c}</span></li>`).join('');
  const winnerText = data.verdict?.winner === 'a' ? entityA : data.verdict?.winner === 'b' ? entityB : "It's a Tie";
  const slugA = entityA.toLowerCase().replace(/\s+/g, '-');
  const slugB = entityB.toLowerCase().replace(/\s+/g, '-');
  const pageUrl = `https://choosevs.com/compare/${slugA}-vs-${slugB}`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${entityA} vs ${entityB} | ChooseVS</title><meta name="description" content="${data.verdict?.summary || ''}"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#1e293b;line-height:1.6}.container{max-width:1200px;margin:0 auto;padding:20px}.header{text-align:center;padding:40px 20px;border-bottom:1px solid #e2e8f0}.badge{display:inline-block;background:#dbeafe;color:#1d4ed8;padding:4px 12px;border-radius:9999px;font-size:12px;font-weight:600;margin-bottom:16px}h1{font-size:2.5rem;font-weight:800;margin-bottom:12px}.subtitle{font-size:1.1rem;color:#64748b}.entities{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:40px 0}.entity-card{border:1px solid #e2e8f0;border-radius:16px;padding:32px;text-align:center;border-top:4px solid #3b82f6}.entity-card.b{border-top-color:#8b5cf6}.entity-card h2{font-size:1.5rem;margin-bottom:8px}.entity-card p{color:#64748b}.vs-badge{display:flex;align-items:center;justify-content:center;margin:20px 0}.vs-badge div{width:64px;height:64px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:20px}table{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:40px 0}th{background:#f8fafc;padding:12px 16px;text-align:left;font-weight:600;color:#374151;border-bottom:1px solid #e2e8f0}.proscons{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:40px 0}.pc-card{border:1px solid #e2e8f0;border-radius:12px;padding:24px}.pc-card h3{margin-bottom:12px;font-size:1.1rem}.pc-card ul{list-style:none;display:flex;flex-direction:column;gap:8px}.pros h3{color:#166534}.cons h3{color:#991b1b}.verdict{background:linear-gradient(135deg,#eff6ff,#faf5ff);border:1px solid #bfdbfe;border-radius:16px;padding:40px;text-align:center;margin:40px 0}.verdict h2{font-size:1.8rem;margin-bottom:16px}.verdict p{color:#475569;font-size:1.1rem;max-width:600px;margin:0 auto 24px}.rec{background:#fff;border-radius:12px;padding:20px;border:1px solid #bfdbfe;max-width:600px;margin:0 auto;text-align:left}.rec h4{color:#1d4ed8;font-weight:700;margin-bottom:8px}.share-bar{display:flex;gap:8px;justify-content:center;padding:24px;border-top:1px solid #e2e8f0;margin-top:40px;flex-wrap:wrap}.share-bar a{padding:8px 16px;border-radius:8px;background:#f8fafc;color:#475569;text-decoration:none;font-size:14px;border:1px solid #e2e8f0}.footer{background:#0f172a;color:#94a3b8;padding:40px 20px;text-align:center;font-size:14px}@media(max-width:768px){.entities,.proscons{grid-template-columns:1fr}h1{font-size:1.8rem}}</style></head><body>
<div class="header container"><div class="badge">${data.category || 'Comparison'}</div><h1>${entityA} vs ${entityB}</h1><p class="subtitle">Expert comparison with detailed specs, pros &amp; cons, and a clear verdict.</p></div>
<div class="container"><div class="entities"><div class="entity-card a"><h2>${entityA}</h2><p>${data.entityATagline || ''}</p></div><div class="entity-card b"><h2>${entityB}</h2><p>${data.entityBTagline || ''}</p></div></div><div class="vs-badge"><div>VS</div></div><table><thead><tr><th>Specification</th><th>${entityA}</th><th>${entityB}</th><th style="text-align:center;width:60px">Winner</th></tr></thead><tbody>${specsHTML}</tbody></table>
<div class="proscons"><div><div class="pc-card pros"><h3>${entityA} Pros</h3><ul>${prosA}</ul></div><div class="pc-card cons" style="margin-top:16px"><h3>${entityA} Cons</h3><ul>${consA}</ul></div></div><div><div class="pc-card pros"><h3>${entityB} Pros</h3><ul>${prosB}</ul></div><div class="pc-card cons" style="margin-top:16px"><h3>${entityB} Cons</h3><ul>${consB}</ul></div></div></div>
<div class="verdict"><div style="display:inline-block;background:#2563eb;color:#fff;padding:8px 20px;border-radius:9999px;font-size:14px;font-weight:700;margin-bottom:16px">Expert Verdict</div><h2>${data.verdict?.winner === 'tie' ? 'The Verdict: It Depends on Your Needs' : `Winner: ${winnerText}`}</h2><p>${data.verdict?.summary || ''}</p><div class="rec"><h4>Our Recommendation</h4><p>${data.verdict?.recommendation || ''}</p></div></div>
<div class="share-bar"><span style="font-weight:600;color:#374151">Share:</span><a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(entityA + ' vs ' + entityB)}&url=${encodeURIComponent(pageUrl)}" target="_blank">X</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}" target="_blank">Facebook</a><a href="https://www.reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(entityA + ' vs ' + entityB)}" target="_blank">Reddit</a><a href="https://api.whatsapp.com/send?text=${encodeURIComponent(entityA + ' vs ' + entityB + ' ' + pageUrl)}" target="_blank">WhatsApp</a></div></div>
<div class="footer">&copy; 2026 ChooseVS. All rights reserved. Comparison generated on-the-fly by AI.</div>
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"ComparisonPage","name":entityA+" vs "+entityB,"description":data.verdict?.summary||"","mainEntity":[{"@type":"Product","name":entityA,"description":data.entityATagline||""},{"@type":"Product","name":entityB,"description":data.entityBTagline||""}],"dateModified":new Date().toISOString()})}</script></body></html>`;
}

export const onRequest: PagesFunction<{ GEMINI_API_KEY: string }> = async (context) => {
  const { request, params, env } = context;
  const slug = params.slug as string;

  // Known comparison → serve static
  if (slug && KNOWN_COMPARISONS.includes(slug)) {
    return await context.next();
  }

  if (slug && slug.includes('-vs-')) {
    const parts = slug.split('-vs-');
    const decode = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const entityA = decode(parts[0]);
    const entityB = decode(parts[1]);
    const cacheKey = `compare:${slug}`;

    try {
      // Check KV cache first
      const kv = (env as any).COMPARE_CACHE;
      if (kv) {
        const cached = await kv.get(cacheKey, 'text');
        if (cached) {
          return new Response(cached, { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'X-Cache': 'HIT' } });
        }
      }

      // Generate via Gemini
      const prompt = `Compare "${entityA}" vs "${entityB}". Return JSON only: {"category":"string","entityATagline":"string","entityBTagline":"string","specs":[{"label":"string","valueA":"string","valueB":"string","winner":"a|b|tie"}],"prosA":["string"],"consA":["string"],"prosB":["string"],"consB":["string"],"verdict":{"winner":"a|b|tie","summary":"string","recommendation":"string"}}. Be factual, specific, helpful. Include 8-10 specs, 4-6 pros/cons each.`;

      const text = await callGemini(prompt, env.GEMINI_API_KEY);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!data) return new Response('Failed to generate comparison', { status: 500 });

      const html = generateHTML(entityA, entityB, data);

      // Store in KV cache
      if (kv) {
        await kv.put(cacheKey, html, { expirationTtl: 60 * 60 * 24 * 30 }); // 30 days
      }

      return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'X-Cache': 'MISS' } });
    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }

  const url = new URL(request.url);
  return Response.redirect(url.origin, 302);
};
