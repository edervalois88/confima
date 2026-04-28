'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { DispatchInvitationsResult, DispatchInvitationsUseCase } from '@/application/use-cases/DispatchInvitationsUseCase';
import { InvitationTemplateDefinition } from '@/application/services/WhatsAppComplianceService';
import { WhatsAppCloudAdapter } from '@/infrastructure/adapters/WhatsAppCloudAdapter';

const prisma = new PrismaClient();

const DispatchFormSchema = z.object({
  mode: z.enum(['dry-run', 'send']),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export interface DispatchActionState {
  ok: boolean;
  message: string;
  result?: DispatchInvitationsResult;
}

export async function dispatchInvitationsAction(
  _previousState: DispatchActionState,
  formData: FormData
): Promise<DispatchActionState> {
  const parsed = DispatchFormSchema.safeParse({
    mode: formData.get('mode'),
    limit: formData.get('limit') || 25,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: 'Parametros invalidos para el despacho.',
    };
  }

  const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!tenant) {
    return {
      ok: false,
      message: 'No hay tenant configurado para despachar invitaciones.',
    };
  }

  const useCase = new DispatchInvitationsUseCase(new WhatsAppCloudAdapter());
  const result = await useCase.execute(
    tenant.id,
    InvitationTemplateDefinition.name,
    {
      dryRun: parsed.data.mode === 'dry-run',
      limit: parsed.data.limit,
    }
  );

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/guests');

  if (result.dryRun) {
    return {
      ok: true,
      message: `Validacion lista: ${result.skipped} se podrian enviar, ${result.blocked} bloqueadas.`,
      result,
    };
  }

  return {
    ok: result.failed === 0,
    message: `Despacho terminado: ${result.sent} enviadas, ${result.blocked} bloqueadas, ${result.failed} fallidas.`,
    result,
  };
}
