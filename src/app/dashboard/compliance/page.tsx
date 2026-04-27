import React from "react";
import { AlertTriangle, CheckCircle2, FileText, MessageSquareText, ShieldCheck, StopCircle } from "lucide-react";
import { InvitationTemplateDefinition } from "@/application/services/WhatsAppComplianceService";

const controls = [
  {
    title: "Plantilla aprobada",
    status: "Requerida",
    detail: "Todo primer contacto de negocio se envia como template de Meta, no como texto libre.",
    icon: FileText,
  },
  {
    title: "Consentimiento WhatsApp",
    status: "Activo",
    detail: "Cada invitado guarda fuente, fecha y texto de opt-in antes de entrar a envios masivos.",
    icon: ShieldCheck,
  },
  {
    title: "Opt-out inmediato",
    status: "Activo",
    detail: "STOP, baja, cancelar o salir pausan la mensajeria del invitado y dejan auditoria.",
    icon: StopCircle,
  },
  {
    title: "Ventana 24h",
    status: "Activo",
    detail: "Las respuestas libres se limitan a conversaciones iniciadas por el invitado.",
    icon: MessageSquareText,
  },
];

export default function CompliancePage() {
  return (
    <div className="space-y-8 fade-in">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-stone-950">
          Compliance WhatsApp
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-stone-600">
          Controles para reducir riesgo de bloqueo del numero: consentimiento explicito,
          plantillas aprobadas, salida voluntaria y uso estricto de la ventana de atencion.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {controls.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <Icon className="h-5 w-5 text-stone-700" />
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {item.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-stone-950">{item.title}</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">{item.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-stone-950">Machote para Meta</h3>
          </div>

          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Nombre sugerido</dt>
              <dd className="mt-1 font-mono text-stone-900">{InvitationTemplateDefinition.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Categoria</dt>
              <dd className="mt-1 text-stone-900">{InvitationTemplateDefinition.category}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Idioma</dt>
              <dd className="mt-1 text-stone-900">{InvitationTemplateDefinition.language}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Variables</dt>
              <dd className="mt-1 text-stone-900">{InvitationTemplateDefinition.requiredVariables.join(", ")}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-md border border-stone-200 bg-stone-50 p-4">
            <p className="text-sm leading-6 text-stone-800">{InvitationTemplateDefinition.sampleBody}</p>
          </div>
        </article>

        <article className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <h3 className="text-lg font-semibold text-stone-950">Riesgos a vigilar</h3>
          </div>
          <ul className="space-y-3 text-sm leading-6 text-stone-700">
            <li>Importar telefonos sin evidencia de opt-in para WhatsApp.</li>
            <li>Enviar promociones o lenguaje comercial en una plantilla de utilidad.</li>
            <li>Mandar muchos mensajes seguidos a invitados que no responden.</li>
            <li>No respetar solicitudes como STOP, cancelar, baja o salir.</li>
            <li>Responder con IA datos no confirmados por facts o FAQs del evento.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
