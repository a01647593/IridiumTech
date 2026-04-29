type ThinkingIndicatorProps = {
  label?: string;
  detail?: string;
};

export default function ThinkingIndicator({
  label = 'El asistente está analizando...'
  ,
  detail = 'Procesando tu consulta y redactando una respuesta clara.'
}: ThinkingIndicatorProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm text-primary">
        <span className="material-symbols-outlined text-[18px] material-symbols-fill">smart_toy</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm max-w-[85%] sm:max-w-[70%]">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm sm:text-base">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          <span>{label}</span>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">{detail}</p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
          <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.15s]" />
          <span className="h-2 w-2 rounded-full bg-slate-300 animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}