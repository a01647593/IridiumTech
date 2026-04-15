export default function AdminEditCourse() {
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200">
        <div><h2 className="text-2xl font-bold tracking-tight">Advanced Neural Architectures</h2><p className="text-slate-500 text-sm">Editando la estructura actual del curso.</p></div>
        <div className="flex gap-4">
          <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold">Guardar Cambios</button>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-10">
          <section className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-8">Plan de Estudios</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg group">
                <div className="flex items-center gap-4"><span className="material-symbols-outlined text-slate-300">drag_indicator</span><span className="font-semibold text-primary">Foundations of Attention</span></div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">edit</span><span className="material-symbols-outlined text-slate-400">delete</span></div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-lg group">
                <div className="flex items-center gap-4"><span className="material-symbols-outlined text-slate-300">drag_indicator</span><span className="font-semibold text-slate-500">Transformer Mechanics</span></div>
                <div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">edit</span><span className="material-symbols-outlined text-slate-400">delete</span></div>
              </div>
            </div>
          </section>
        </div>
        <div className="col-span-12 lg:col-span-5 space-y-10">
          <section className="bg-red-50/50 border-2 border-red-100 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4"><span className="material-symbols-outlined text-red-600">warning</span><h2 className="text-lg font-bold text-red-600">Zona peligrosa</h2></div>
            <p className="text-sm text-slate-600 mb-6">Una vez que elimines este curso, no habrá vuelta atrás.</p>
            <button className="w-full py-3 bg-red-600 text-white rounded-lg font-bold shadow-sm hover:bg-red-700">Eliminar curso</button>
          </section>
        </div>
      </div>
    </div>
  );
}
