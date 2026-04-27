import { WeddingPlanningOrchestrator } from "@/application/use-cases/WeddingPlanningOrchestrator";
import { LLMJudgeService } from "@/application/services/LLMJudgeService";
import { GoldenDataset } from "@/infrastructure/testing/GoldenDataset";
import { HumanMessage } from "@langchain/core/messages";

/**
 * @fileoverview Script ejecutor de evaluaciones LLM (Evals).
 * Se ejecuta en el pipeline de CI/CD para validar la calidad de los agentes.
 */

async function runEvaluations() {
  console.log("--- INICIANDO PIPELINE DE EVALUACIÓN DE AGENTES (EVALS) ---");
  
  // Dependencias (Simuladas para el entorno de test)
  const orchestrator = new WeddingPlanningOrchestrator({} as any, {} as any);
  const judge = new LLMJudgeService({} as any);

  let totalScore = 0;
  let casesPassed = 0;

  for (const testCase of GoldenDataset) {
    console.log(`[EVAL] Evaluando Caso: \${testCase.id}...`);

    // 1. Ejecutar Agente
    const stream = orchestrator.streamPlanning({
      messages: [new HumanMessage(testCase.input)],
      tenantId: "TEST_TENANT",
      correlationId: `EVAL_\${testCase.id}`
    });

    let agentResponse = "";
    for await (const event of stream) {
      if (event.node === "finalizer") agentResponse = event.message;
    }

    // 2. Calificar con LLM-as-a-Judge
    const result = await judge.evaluateContextFidelity(
      testCase.input,
      agentResponse,
      testCase.groundTruth
    );

    totalScore += result.score;
    if (result.passed) casesPassed++;

    console.log(`   > Score: \${result.score} | Passed: \${result.passed}`);
    if (!result.passed) {
      console.warn(`   > Rationale: \${result.rationale}`);
    }
  }

  const finalScore = totalScore / GoldenDataset.length;
  console.log(`\n--- RESULTADO FINAL: \${finalScore.toFixed(2)}% | Casos Exitosos: \${casesPassed}/\${GoldenDataset.length} ---`);

  if (finalScore < 95) {
    console.error("❌ ERROR: La calidad de los agentes ha caído por debajo del umbral del 95%. Bloqueando despliegue.");
    process.exit(1);
  } else {
    console.log("✅ ÉXITO: Los agentes cumplen con los estándares de producción.");
    process.exit(0);
  }
}

// runEvaluations();
