import crypto from 'crypto';

async function runLoadTest() {
  const TARGET_URL = 'http://localhost:3002/api/webhook/whatsapp';
  const APP_SECRET = process.env.WHATSAPP_APP_SECRET || 'test_secret';
  const TOTAL_REQUESTS = 1000;
  const CONCURRENCY = 50;

  console.log('🔥 Iniciando Prueba de Estrés: 1,000 solicitudes concurrentes...');

  const results: number[] = [];
  let failures = 0;

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
    const chunk = Array.from({ length: CONCURRENCY }).map(async () => {
      const start = Date.now();
      const body = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WABA_' + Math.random(),
          changes: [{
            value: {
              messages: [{
                id: 'MSG_' + Math.random(),
                from: '521234567890',
                text: { body: 'Mensaje de carga' },
                type: 'text'
              }]
            },
            field: 'messages'
          }]
        }]
      });

      const signature = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');

      try {
        const res = await fetch(TARGET_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hub-signature-256': signature
          },
          body
        });

        if (res.status === 200) {
          results.push(Date.now() - start);
        } else {
          failures++;
          if (failures === 1) console.log('❌ Primer fallo detectado. Status: ' + res.status + ' - ' + await res.text());
        }
      } catch (e: any) {
        failures++;
        if (failures === 1) console.log('🔥 Error de red en la primera petición: ' + e.message);
      }

    });

    await Promise.all(chunk);
    if (i % 200 === 0) console.log('✅ Procesadas ' + i + ' solicitudes...');
  }

  const p95 = results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)];
  const p99 = results.sort((a, b) => a - b)[Math.floor(results.length * 0.99)];

  console.log('\n--- RESULTADOS DE ESTRÉS ---');
  console.log('Total Solicitudes: ' + TOTAL_REQUESTS);
  console.log('Fallos: ' + failures);
  console.log('Latencia p95: ' + p95 + 'ms');
  console.log('Latencia p99: ' + p99 + 'ms');
  console.log('----------------------------\n');
}

runLoadTest();
