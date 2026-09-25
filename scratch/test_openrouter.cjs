const dotenv = require('dotenv');
const fs = require('fs');
const env = dotenv.parse(fs.readFileSync('.env'));
const key = env.VITE_OPENROUTER_API_KEY;

async function checkOR() {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: 'Bearer ' + key }
    });
    const data = await res.json();
    const freeModels = (data.data || []).filter(m => m.id.endsWith(':free')).map(m => m.id);
    console.log('Available free models on OpenRouter (total ' + freeModels.length + '):', freeModels.slice(0, 15));
    
    // Test the first 3 active free models
    for (const model of freeModels.slice(0, 4)) {
      try {
        const start = Date.now();
        const callRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + key
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Say hello in 3 words' }],
            max_tokens: 20
          })
        });
        const elapsed = Date.now() - start;
        if (callRes.ok) {
          const json = await callRes.json();
          console.log(`✅ OpenRouter [${model}] SUCCESS (${elapsed}ms):`, json.choices[0]?.message?.content?.trim());
        } else {
          console.log(`❌ OpenRouter [${model}] FAILED (${callRes.status})`);
        }
      } catch (err) {
        console.log(`❌ OpenRouter [${model}] ERROR:`, err.message);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
checkOR();
