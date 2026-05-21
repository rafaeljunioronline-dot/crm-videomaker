import React from 'react';
import { useRouter } from 'next/router';
import { LayoutDashboard, Calendar, PlusCircle, History } from 'lucide-react';

export default function BottomNav() {
  const router = useRouter();

  // Função para descobrir qual página está ativa e mudar a cor do ícone
  const isActive = (path) => router.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-2 z-50">
      <div className="max-w-md mx-auto flex justify-around items-center">
        
        {/* Botão Dashboard */}
        <button 
          onClick={() => router.push('/')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${isActive('/') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <LayoutDashboard size={20} />
          <span>Início</span>
        </button>

        {/* Botão Calendário */}
        <button 
          onClick={() => router.push('/calendario')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${isActive('/calendario') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Calendar size={20} />
          <span>Calendário</span>
        </button>

        {/* Botão Novo Serviço */}
        <button 
          onClick={() => router.push('/novo-servico')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${isActive('/novo-servico') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <PlusCircle size={20} />
          <span>Novo</span>
        </button>

        {/* Botão Histórico */}
        <button 
          onClick={() => router.push('/historico')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${isActive('/historico') ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <History size={20} />
          <span>Histórico</span>
        </button>

      </div>
    </nav>
  );
}