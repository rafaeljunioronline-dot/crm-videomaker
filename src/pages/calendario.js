import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar as CalendarIcon, Video, DollarSign, Clock, User, MessageSquare, ListFilter, RotateCcw } from 'lucide-react';

export default function Calendario() {
  const [servicos, setServicos] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(null); // Começa nulo para o padrão ser o Mês Inteiro
  const [carregando, setCarregando] = useState(true);

  // Estados para controlar o mês visível no calendário
  const [mesAtual, setMesAtual] = useState(new Date().getMonth());
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  useEffect(() => {
    buscarEventos();
  }, []);

  const buscarEventos = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase
        .from('servicos')
        .select('*');

      if (error) throw error;
      if (data) setServicos(data);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setCarregando(false);
    }
  };

  const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const obterDiasDoMes = () => {
    const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay();
    const totalDiasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
    
    const matrizDias = [];
    
    for (let i = 0; i < primeiroDiaDoMes; i++) {
      matrizDias.push(null);
    }
    
    for (let dia = 1; dia <= totalDiasNoMes; dia++) {
      matrizDias.push(new Date(anoAtual, mesAtual, dia));
    }
    
    return matrizDias;
  };

  // Verifica se um dia específico possui algum evento
  const obterEventosDoDia = (dataVerificar) => {
    if (!dataVerificar) return [];
    return servicos.filter(job => {
      const dataJob = new Date(job.data_evento);
      return (
        dataJob.getDate() === dataVerificar.getDate() &&
        dataJob.getMonth() === dataVerificar.getMonth() &&
        dataJob.getFullYear() === dataVerificar.getFullYear()
      );
    });
  };

  // Filtra todos os eventos que pertencem ao mês e ano atualmente selecionados no topo
  const obterEventosDoMesAtual = () => {
    return servicos.filter(job => {
      const dataJob = new Date(job.data_evento);
      return dataJob.getMonth() === mesAtual && dataJob.getFullYear() === anoAtual;
    });
  };

  // Gerencia o clique nos dias (filtra ou limpa o filtro)
  const lidarComCliqueNoDia = (dataItem) => {
    if (dataSelecionada && dataSelecionada.toDateString() === dataItem.toDateString()) {
      // Se clicar no dia que já estava selecionado, limpa o filtro e volta para o Mês Inteiro
      setDataSelecionada(null);
    } else {
      setDataSelecionada(dataItem);
    }
  };

  const mesAnterior = () => {
    setDataSelecionada(null); // Limpa o filtro do dia ao mudar de mês
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual(anoAtual - 1);
    } else {
      setMesAtual(mesAtual - 1);
    }
  };

  const proximoMes = () => {
    setDataSelecionada(null); // Limpa o filtro do dia ao mudar de mês
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual(anoAtual + 1);
    } else {
      setMesAtual(mesAtual + 1);
    }
  };

  const dias = obterDiasDoMes();
  
  // Decide se exibe a lista filtrada pelo Dia ou a lista completa do Mês
  const eventosExibidos = dataSelecionada 
    ? obterEventosDoDia(dataSelecionada) 
    : obterEventosDoMesAtual();

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans">
      
      {/* HEADER TOP */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-4">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Cronograma</span>
        <h1 className="text-xl font-black text-white">Agenda Visual</h1>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-4">
        
        {/* CONTROLES DO MÊS */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <button onClick={mesAnterior} className="text-sm font-bold text-indigo-400 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg active:scale-95 transition-transform">◀</button>
          <h2 className="text-sm font-black uppercase text-slate-200 tracking-wider">
            {MESES[mesAtual]} {anoAtual}
          </h2>
          <button onClick={proximoMes} className="text-sm font-bold text-indigo-400 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg active:scale-95 transition-transform">▶</button>
        </div>

        {/* GRADE DO CALENDÁRIO */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-800">
            {DIAS_SEMANA.map((d, index) => <div key={index}>{d}</div>)}
          </div>

          {carregando ? (
            <div className="text-center text-xs text-slate-500 py-10">Sincronizando agenda...</div>
          ) : (
            <div className="grid grid-cols-7 gap-y-2 text-center text-sm font-semibold">
              {dias.map((dataItem, index) => {
                if (!dataItem) return <div key={index} className="py-2"></div>;

                const temEventos = obterEventosDoDia(dataItem).length > 0;
                const ehHoje = new Date().toDateString() === dataItem.toDateString();
                const ehSelecionado = dataSelecionada?.toDateString() === dataItem.toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => lidarComCliqueNoDia(dataItem)}
                    className={`py-2 relative flex flex-col items-center justify-center rounded-xl mx-0.5 transition-all active:scale-90
                      ${ehSelecionado ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20' : ''}
                      ${ehHoje && !ehSelecionado ? 'border border-indigo-400 text-indigo-400' : ''}
                      ${!ehSelecionado && !ehHoje ? 'hover:bg-slate-800 text-slate-300' : ''}
                    `}
                  >
                    <span>{dataItem.getDate()}</span>
                    {temEventos && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${ehSelecionado ? 'bg-white' : 'bg-indigo-400'}`}></span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* LISTAGEM DOS EVENTOS ABAIXO (MÊS OU DIA SELECIONADO) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center mt-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ListFilter size={14} className="text-indigo-400" /> 
              {dataSelecionada 
                ? `Filtro: ${dataSelecionada.toLocaleDateString('pt-BR')}` 
                : `Todos os Jobs de ${MESES[mesAtual]}`
              }
            </h3>
            
            {/* Se houver filtro por dia, mostra um botão amigável para voltar para o mês inteiro */}
            {dataSelecionada && (
              <button 
                onClick={() => setDataSelecionada(null)}
                className="text-[10px] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-indigo-400 font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all"
              >
                <RotateCcw size={10} /> Mostrar Mês Todo
              </button>
            )}
          </div>

          {eventosExibidos.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 p-6 rounded-2xl text-center">
              <p className="text-xs text-slate-500">
                {dataSelecionada 
                  ? 'Nenhum evento agendado para este dia.' 
                  : `Nenhum compromisso agendado para o mês de ${MESES[mesAtual]}.`
                }
              </p>
            </div>
          ) : (
            eventosExibidos.map((job) => (
              <div key={job.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md animate-in fade-in duration-200">
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] border px-2 py-0.5 rounded font-bold uppercase ${job.tipo_servico === 'Fixo Semanal' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-indigo-300 border-slate-700'}`}>
                      {job.tipo_servico === 'Fixo Semanal' ? '🏪 Recorrente Fixo' : job.tipo_servico}
                    </span>
                    <h4 className="text-base font-bold text-white mt-1.5">{job.cliente_nome}</h4>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${job.status_pagamento === 'pago' ? 'bg-green-500/10 text-green-400' : job.status_pagamento === 'sinal_pago' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                    {job.status_pagamento === 'pago' ? '🟢 Pago' : job.status_pagamento === 'sinal_pago' ? '🟡 Sinal' : '🔴 Pendente'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-slate-500" /> 
                    {formatarMoeda(job.valor_total)} {job.tipo_servico === 'Fixo Semanal' && '/sem'}
                  </div>
                  <div className="flex items-center gap-1.5"><User size={14} className="text-slate-500" /> {job.cliente_contato || 'Sem Whats'}</div>
                  <div className="flex items-center gap-1.5 col-span-2 text-slate-400 font-mono mt-0.5">
                    📅 {job.tipo_servico === 'Fixo Semanal' ? 'Fixo todo sábado' : `Data: ${new Date(job.data_evento).toLocaleDateString('pt-BR')}`}
                  </div>
                  {job.data_entrega && job.tipo_servico !== 'Fixo Semanal' && (
                    <div className="flex items-center gap-1.5 col-span-2 mt-1 text-indigo-300 font-medium">
                      <Clock size={14} /> 📬 Prazo de entrega: {new Date(job.data_entrega).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                {job.observacoes && (
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex gap-2 items-start">
                    <MessageSquare size={14} className="text-slate-600 mt-0.5 shrink-0" />
                    <p className="italic">{job.observacoes}</p>
                  </div>
                )}

              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}