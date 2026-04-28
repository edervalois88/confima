'use client';

import React, { useActionState } from 'react';
import { AlertCircle, Ban, CheckCircle2, Clock3, MessageSquareText, Send, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { dispatchInvitationsAction, DispatchActionState } from '@/presentation/actions/dispatchInvitationActions';
import { cn } from '@/lib/utils';

const initialState: DispatchActionState = {
  ok: true,
  message: 'Valida el lote antes de enviar a WhatsApp.',
};

export function DispatchInvitationsPanel() {
  const [state, formAction, isPending] = useActionState(dispatchInvitationsAction, initialState);
  const details = state.result?.details.slice(0, 6) || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="rounded-lg border border-[#d7d2c8] bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-[#20201d]">
            <MessageSquareText className="h-5 w-5 text-[#7a643d]" />
            Despacho WhatsApp
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d5a52]">
            Procesa invitados en estado PENDING_SEND usando la plantilla aprobada de Meta y las reglas de opt-in.
          </p>
        </div>

        <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-center">
          <label className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#77736b] sm:justify-start">
            Lote
            <input
              name="limit"
              type="number"
              min="1"
              max="100"
              defaultValue="25"
              className="w-24 rounded-md border border-[#d7d2c8] bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#20201d]"
            />
          </label>
          <button
            type="submit"
            name="mode"
            value="dry-run"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d7d2c8] bg-white px-4 py-2.5 text-sm font-semibold text-[#20201d] transition-colors hover:bg-[#f7f7f4] disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            Validar lote
          </button>
          <button
            type="submit"
            name="mode"
            value="send"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#20201d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#36332f] disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Enviar invitaciones
          </button>
        </form>
      </div>

      <motion.div
        key={state.message}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-5 rounded-md border px-4 py-3 text-sm ${state.ok ? 'border-[#d7d2c8] bg-[#f7f7f4] text-[#5d5a52]' : 'border-[#e7c6c6] bg-[#f8eeee] text-[#8e3f3f]'}`}
      >
        {isPending ? 'Procesando lote...' : state.message}
      </motion.div>

      {state.result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          <Metric label={state.result.dryRun ? 'Enviarían' : 'Enviadas'} value={state.result.dryRun ? state.result.skipped : state.result.sent} />
          <Metric label="Bloqueadas" value={state.result.blocked} />
          <Metric label="Fallidas" value={state.result.failed} />
          <Metric label="Candidatas" value={state.result.totalCandidates} />
        </motion.div>
      )}

      {details.length > 0 && (
        <div className="mt-5 divide-y divide-[#ebe7df] rounded-md border border-[#ebe7df]">
          {details.map((detail) => (
            <motion.div
              key={`${detail.guestId}-${detail.status}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_120px_1.5fr]"
            >
              <div className="font-medium text-[#20201d]">{detail.guestName}</div>
              <div className={cn('flex items-center gap-1 text-xs font-semibold', statusTone(detail.status))}>
                <StatusIcon status={detail.status} />
                {statusLabel(detail.status)}
              </div>
              <div className="text-[#5d5a52]">{detail.reason}</div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#ebe7df] bg-[#fbfaf8] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#77736b]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[#20201d]">{value}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'SENT' || status === 'WOULD_SEND') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === 'BLOCKED') return <Ban className="h-3.5 w-3.5" />;
  if (status === 'SKIPPED') return <Clock3 className="h-3.5 w-3.5" />;
  return <AlertCircle className="h-3.5 w-3.5" />;
}

function statusTone(status: string) {
  if (status === 'SENT' || status === 'WOULD_SEND') return 'text-[#2f6b45]';
  if (status === 'BLOCKED' || status === 'FAILED') return 'text-[#8e3f3f]';
  return 'text-[#7a643d]';
}

function statusLabel(status: string) {
  if (status === 'WOULD_SEND') return 'LISTA';
  if (status === 'SENT') return 'ENVIADA';
  if (status === 'BLOCKED') return 'BLOQUEADA';
  if (status === 'SKIPPED') return 'OMITIDA';
  return 'FALLIDA';
}
