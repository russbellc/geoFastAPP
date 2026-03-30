"use client";

import { useState } from "react";

export default function ScoreExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-on-surface-variant hover:text-primary transition-colors"
        title="Como se calcula el puntaje?"
      >
        <span className="material-symbols-outlined text-sm">help</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative bg-surface-container-low rounded-3xl p-8 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar shadow-2xl border border-outline-variant/10 z-[101]">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">speed</span>
              </div>
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface">Puntaje de Oportunidad</h2>
                <p className="text-xs text-on-surface-variant">Como se calcula (0-100)</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
              Mide que tan probable es que un negocio necesite servicios digitales. Mientras mas alto, mejor oportunidad de venta.
            </p>

            {/* Rules */}
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Reglas Generales</h3>
              <Rule pts={30} text="No tiene sistema de gestion (CMS)" />
              <Rule pts={20} text="Activo en redes sociales (ultimos 30 dias)" />
              <Rule pts={15} text="Sin sitio web o web desactualizada" />
              <Rule pts={12} text="Zona de alta densidad competitiva" />
              <Rule pts={10} text="Sector salud (nicho prioritario)" />
              <Rule pts={8} text="Sin agenda online" />
              <Rule pts={5} text="Sin chatbot ni WhatsApp" />
            </div>

            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-tertiary mb-2">Bonus Google Maps</h3>
              <Rule pts={5} text="Tiene telefono pero no website" color="tertiary" />
              <Rule pts={5} text="Pocas reviews (&lt; 10)" color="tertiary" />
              <Rule pts={3} text="Rating bajo (&lt; 4.0)" color="tertiary" />
              <Rule pts={3} text="Sin horario publicado en GMaps" color="tertiary" />
            </div>

            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Bonus Salud (LiaFlow)</h3>
              <Rule pts={5} text="Subcategoria prioritaria (clinica, consultorio...)" color="secondary" />
              <Rule pts={3} text="Tiene web pero no sistema clinico" color="secondary" />
            </div>

            {/* Classification */}
            <div className="border-t border-outline-variant/10 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Clasificacion</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-center text-sm font-black text-tertiary bg-tertiary/10 py-1 rounded-lg">80-100</span>
                  <div>
                    <span className="text-xs font-bold text-error uppercase">Caliente</span>
                    <p className="text-[11px] text-on-surface-variant">Contactar esta semana</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-center text-sm font-black text-primary bg-primary/10 py-1 rounded-lg">50-79</span>
                  <div>
                    <span className="text-xs font-bold text-secondary uppercase">Tibio</span>
                    <p className="text-[11px] text-on-surface-variant">Nutrir con contenido</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-center text-sm font-black text-on-surface-variant bg-surface-container-highest py-1 rounded-lg">0-49</span>
                  <div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase">Frio</span>
                    <p className="text-[11px] text-on-surface-variant">Monitorear</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Rule({ pts, text, color = "primary" }: { pts: number; text: string; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-black w-10 text-center text-${color}`}>+{pts}</span>
      <span className="text-xs text-on-surface">{text}</span>
    </div>
  );
}
