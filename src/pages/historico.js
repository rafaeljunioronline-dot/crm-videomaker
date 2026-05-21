import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Search, Film, Calendar, DollarSign, ArrowLeftRight, Pencil, Trash2 } from 'lucide-react';

export default function Historico() {
  const router = useRouter();
  const [servicos, setServicos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarHistoricoCompleto();
  }, []);

  const buscarHistoricoCompleto = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('data_evento', { ascending: false });

      if (error) throw error;
      if (data) setServicos(data);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Função para deletar o serviço do banco de dados
  const deletarServico = async (id, nomeCliente) => {
    const confirmar = window.confirm(`Tem certeza que deseja excluir permanentemente o serviço de "${nomeCliente}"?`);
    
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Serviço removido com sucesso!');
      // Atualiza a lista na tela tirando o que foi deletado
      setServicos(servicos.filter(job => job.id !== id));
    } catch (error) {
      alert('Erro ao deletar: ' + error.message);
    }
  };

  // Redireciona para a página de cadastro passando o ID do job para edição
  const editarServico = (id) => {
    router.push(`/novo-servico?edit=${id}`);
  };

  const servicosFiltrados = servicos.filter((job) =>
    job.cliente_nome.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans">
      
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-4">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Banco de Dados</span>
        <h1 className="text-xl font-black text-white">Histórico Geral</h1>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-4">
        
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search size={18} />
          </span>
          <input 
            type="text"
            placeholder="Buscar por nome da cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ArrowLeftRight size={14} className="text-indigo-400" /> Fluxo de Contratos
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {servicosFiltrados.length} encontrados
            </span>
          </div>

          {carregando ? (
            <p className="text-xs text-slate-500 text-center py-8">Consultando arquivos na nuvem...</p>
          ) : servicosFiltrados.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center">
              <p className="text-xs text-slate-500">Nenhum registro encontrado.</p>
            </div>
          ) : (
            servicosFiltrados.map((job) => (
              <div 
                key={job.id} 
                className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2">
                    <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-indigo-400 shrink-0 mt-0.5">
                      <Film size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">{job.cliente_nome}</h3>
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{job.tipo_servico}</span>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                    job.status_pagamento === 'pago' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                    job.status_pagamento === 'sinal_pago' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {job.status_pagamento === 'pago' ? 'Quitado' : job.status_pagamento === 'sinal_pago' ? 'Sinal' : 'Pendente'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800/40 text-xs text-slate-400">
                  <div className="flex items-center gap-1 font-mono">
                    <Calendar size={13} className="text-slate-600" />
                    {new Date(job.data_evento).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center font-bold text-slate-200 font-mono">
                    <DollarSign size={13} className="text-slate-500" />
                    {formatarMoeda(job.valor_total).replace('R$', '')}
                  </div>
                </div>

                {/* BOTÕES DE CONTROLE COMPACTOS PARA CELULAR */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button 
                    onClick={() => editarServico(job.id)}
                    className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-indigo-400 active:scale-95 transition-all"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button 
                    onClick={() => deletarServico(job.id, job.cliente_nome)}
                    className="flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 text-red-400 active:scale-95 transition-all"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}