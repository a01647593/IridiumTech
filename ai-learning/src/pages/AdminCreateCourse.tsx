import { useNavigate } from 'react-router-dom';

export default function AdminCreateCourse() {
  const navigate = useNavigate();
  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto space-y-6 sm:space-y-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div><h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight mb-2">Crear Nuevo Curso</h1><p className="text-slate-500 max-w-2xl font-medium text-sm sm:text-base">Diseña experiencias de aprendizaje de alta gama utilizando herramientas de IA integradas.</p></div>
        <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-bold text-primary bg-white border border-primary rounded-xl">Vista Previa</button>
          <button className="flex-1 sm:flex-none px-4 sm:px-8 py-2.5 text-sm font-bold text-white bg-accent-blue rounded-xl shadow-lg" onClick={() => navigate('/admin')}>Publicar</button>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 sm:p-8 shadow-sm border border-slate-200 space-y-6 sm:space-y-8">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2"><span className="material-symbols-outlined text-accent-blue">info</span> Información Básica</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título del Curso</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-blue" placeholder="Ej. Estrategias de IA para Ejecutivos" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</label>
            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-accent-blue" rows={4}></textarea>
          </div>
        </div>
        <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 hover:border-accent-blue cursor-pointer transition-all">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">upload_file</span>
          <p className="text-on-surface font-semibold">Arrastra archivos aquí o <span className="text-accent-blue">explora tu equipo</span></p>
        </div>
      </div>
    </div>
  );
}
