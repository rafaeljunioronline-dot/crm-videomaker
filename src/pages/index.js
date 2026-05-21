import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Calendar, TrendingUp, CheckCircle, Clock, DollarSign, Check, X, Filter, CalendarDays } from 'lucide-react';

export default function Dashboard() {
  const [servicos, setServicos] = useState([]);
  const [faturadoMes, setFaturadoMes] = useState(0);
  const [aReceber, setAReceber] = useState(0);
  const [carregando, setCarregando] = useState(true);

  // Filtro por intervalo personalizado: começa vazio para carregar tudo por padrão
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Estados para o Modal de Baixa Rápida
  const [modalAberto, setModalAberto] = useState(false);
  const [jobSelecionado, setJobSelecionado] = useState(null);
  const [novoSinal, setNovoSinal] = useState('');
  const [salvandoBaixa, setSalvandoBaixa] = useState(false);

  useEffect(() => {
    buscarDadosDoSupabase();
  }, []);

  // Recalcula o faturamento toda vez que preencherem os quadrados de data ou atualizarem o banco
  useEffect(() => {
    if (servicos.length > 0) {
      calcularFinanceiroCompleto(servicos);
    } else {
      setFaturadoMes(0);
      setAReceber(0);
    }
  }, [dataInicio, dataFim, servicos]);

  const contarSabadosNoIntervalo = (inicioStr, fimStr) => {
    if (!inicioStr || !fimStr) return 0;
    
    const dataInicioObj = new Date(inicioStr + 'T00:00:00');
    const dataFimObj = new Date(fimStr + 'T00:00:00');
    
    let totalSabados = 0;
    let dataCorrente = new Date(dataInicioObj);

    while (dataCorrente <= dataFimObj) {
      if (dataCorrente.getDay() === 6) { // 6 = Sábado
        totalSabados++;
      }
      dataCorrente.setDate(dataCorrente.getDate() + 1);
    }
    return totalSabados;
  };

  const buscarDadosDoSupabase = async () => {
    try {
      setCarregando(true);
      const { data, error } = await supabase.from('servicos').select('*').order('data_evento', { ascending: true });
      if (error) throw error;
      if (data) {
        setServicos(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const calcularFinanceiroCompleto = (listaDeServicos) => {
    let jaRecebido = 0;
    let pendenteReceber = 0;
    
    // Se as datas não estiverem totalmente preenchidas, calcula o TOTAL de sábados históricos salvos na tabela para os fixos
    // Se estiver preenchido, calcula apenas os sábados dentro do intervalo
    const usandoFiltro = dataInicio && dataFim;
    const sabadosNoIntervalo = usandoFiltro ? contarSabadosNoIntervalo(dataInicio, dataFim) : 4; 

    listaDeServicos.forEach((job) => {
      const dataJob = new Date(job.data_evento);
      dataJob.setHours(0, 0, 0, 0);

      const total = parseFloat(job.valor_total) || 0;
      const sinal = parseFloat(job.valor_sinal) || 0;

      let passaNoFiltro = true;

      // Executa o filtro apenas se os dois quadrados de data estiverem digitados
      if (usandoFiltro) {
        const limiteInicio = new Date(dataInicio + 'T00:00:00');
        const limiteFim = new Date(dataFim + 'T00:00:00');
        passaNoFiltro = dataJob >= limiteInicio && dataJob <= limiteFim;
      }

      if (passaNoFiltro) {
        // CASO 1: CLIENTES FIXOS RECORRENTES (SALÃO DE BELEZA)
        if (job.tipo_servico === 'Fixo Semanal') {
          const ganhoNoPeriodo = total * sabadosNoIntervalo;
          if (job.status_pagamento === 'pago') jaRecebido += ganhoNoPeriodo;
          else pendenteReceber += ganhoNoPeriodo;
        } 
        // CASO 2: EVENTOS NORMAIS (CASAMENTO, 15 ANOS, ETC)
        else {
          if (job.status_pagamento === 'pago') {
            jaRecebido += total;
          } else if (job.status_pagamento === 'sinal_pago') {
            jaRecebido += sinal;
            pendenteReceber += (total - sinal);
          } else if (job.status_pagamento === 'pendente') {
            pendenteReceber += total;
          }
        }
      }
    });

    setFaturadoMes(jaRecebido);
    setAReceber(pendenteReceber);
  };

  const abrirBaixaRapida = (job) => {
    setJobSelecionado(job);
    setNovoSinal(job.valor_sinal || '');
    setModalAberto(true);
  };

  const salvarBaixaRapida = async (statusForcado, valorSinalCustomizado) => {
    if (!jobSelecionado) return;
    setSalvandoBaixa(true);

    const payload = {
      status_pagamento: statusForcado,
      valor_sinal: statusForcado === 'sinal_pago' ? parseFloat(valorSinalCustomizado) || 0 : 0
    };

    try {
      const { error } = await supabase.from('servicos').update(payload).eq('id', jobSelecionado.id);
      if (error) throw error;
      setModalAberto(false);
      setJobSelecionado(null);
      buscarDadosDoSupabase();
    } catch (error) {
      alert('Erro ao atualizar pagamento: ' + error.message);
    } finally {
      setSalvandoBaixa(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Filtra os cards visíveis na lista de acordo com as datas se os inputs estiverem populados
  const servicosExibidosNaLista = servicos.filter(job => {
    if (!dataInicio || !dataFim) return true; // Se não tem filtro, exibe tudo
    
    const dataJob = new Date(job.data_evento);
    dataJob.setHours(0, 0, 0, 0);
    const limiteInicio = new Date(dataInicio + 'T00:00:00');
    const limiteFim = new Date(dataFim + 'T00:00:00');
    
    return dataJob >= limiteInicio && dataJob <= limiteFim;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-4">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Geral e Customizado</span>
        <h1 className="text-xl font-black text-white">Videomaker Studio</h1>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-5">
        
        {/* FILTRO: APENAS OS DOIS QUADRADOS DE INTERVALO */}
        <section className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-indigo-400" />
              <span>Filtrar por Intervalo de Datas</span>
            </div>
            {(dataInicio || dataFim) && (
              <button 
                onClick={() => { setDataInicio(''); setDataFim(''); }} 
                className="text-[10px] bg-slate-950 border border-slate-800 text-red-400 font-bold px-2 py-0.5 rounded-lg active:scale-95"
              >
                Limpar Filtro
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">De (Data Inicial):</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Até (Data Final):</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>
        </section>

        {/* CARDS COM BALANÇO GERAL OU DO FILTRO */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative shadow-md">
              <div className="absolute top-2 right-2 text-green-400"><CheckCircle size={16} /></div>
              <p className="text-xs text-slate-400 font-medium">Faturado no Caixa</p>
              <p className="text-lg font-black text-green-400 mt-1">{formatarMoeda(faturadoMes)}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative shadow-md">
              <div className="absolute top-2 right-2 text-yellow-400"><Clock size={16} /></div>
              <p className="text-xs text-slate-400 font-medium">Restante a Receber</p>
              <p className="text-lg font-black text-yellow-400 mt-1">{formatarMoeda(aReceber)}</p>
            </div>
          </div>
        </section>

        {/* FLUXO DE JOBS */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CalendarDays size={16} className="text-indigo-400" /> 
            {dataInicio && dataFim ? 'Jobs no Período Selecionado' : 'Todos os Jobs Cadastrados'}
          </h2>

          {carregando ? (
            <p className="text-xs text-slate-500 text-center py-4">Sincronizando faturamento...</p>
          ) : servicosExibidosNaLista.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Nenhum serviço neste período.</p>
          ) : (
            <div className="space-y-3">
              {servicosExibidosNaLista.map((job) => {
                const total = parseFloat(job.valor_total) || 0;
                const sinal = parseFloat(job.valor_sinal) || 0;
                const falta = total - sinal;

                return (
                  <div key={job.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] border px-2 py-0.5 rounded font-bold uppercase ${job.tipo_servico === 'Fixo Semanal' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-slate-800 text-indigo-300 border-slate-700'}`}>
                          {job.tipo_servico === 'Fixo Semanal' ? '🏪 Recorrente Fixo' : job.tipo_servico}
                        </span>
                        <h3 className="text-base font-bold text-white mt-1.5">{job.cliente_nome}</h3>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${job.status_pagamento === 'pago' ? 'bg-green-500/10 text-green-400' : job.status_pagamento === 'sinal_pago' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                        {job.status_pagamento === 'pago' ? '🟢 Pago' : job.status_pagamento === 'sinal_pago' ? '🟡 Sinal' : '🔴 Pendente'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex justify-between">
                        <span>📅 {job.tipo_servico === 'Fixo Semanal' ? 'Fixo todo sábado' : `Data: ${new Date(job.data_evento).toLocaleDateString('pt-BR')}`}</span>
                        <span className="font-bold text-white">
                          {job.tipo_servico === 'Fixo Semanal' ? `${formatarMoeda(total)} /sem` : `Contrato: ${formatarMoeda(total)}`}
                        </span>
                      </div>
                      {job.status_pagamento === 'sinal_pago' && (
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Sinal pago: {formatarMoeda(sinal)}</span>
                          <span className="text-yellow-500/90 font-bold">Falta pagar: {formatarMoeda(falta)}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => abrirBaixaRapida(job)}
                      className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl border border-slate-700/60 transition-all flex items-center justify-center gap-1.5"
                    >
                      <DollarSign size={14} className="text-emerald-400" />
                      <span>Atualizar Pagamento</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* MODAL DE BAIXA RÁPIDA */}
        {modalAberto && jobSelecionado && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-6 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-black text-white">Dar Baixa / Receber</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Cliente: <span className="text-slate-200 font-bold">{jobSelecionado.cliente_nome}</span></p>
                </div>
                <button onClick={() => setModalAberto(false)} className="bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Valor do Contrato:</span>
                  <span className="font-mono text-white">{formatarMoeda(jobSelecionado.valor_total)}</span>
                </div>
                {jobSelecionado.status_pagamento === 'sinal_pago' && (
                  <div className="flex justify-between text-yellow-400/90 font-bold">
                    <span>Falta Receber:</span>
                    <span className="font-mono">{formatarMoeda(jobSelecionado.valor_total - jobSelecionado.valor_sinal)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={salvandoBaixa}
                  onClick={() => salvarBaixaRapida('pago', 0)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Check size={18} />
                  <span>Marcar Tudo como PAGO</span>
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] uppercase font-bold tracking-wider">Ou atualizar parcial</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase text-slate-400">Mudar Valor Pago do Sinal (R$)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 400.00"
                      value={novoSinal}
                      onChange={(e) => setNovoSinal(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={salvandoBaixa || !novoSinal}
                      onClick={() => salvarBaixaRapida('sinal_pago', novoSinal)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 rounded-xl text-xs transition-all"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}