import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { Save, User, Phone, Video, DollarSign, Calendar as CalendarIcon, FileText, Percent } from 'lucide-react';

export default function NovoServico() {
  const router = useRouter();
  const { edit } = router.query;

  const [carregando, setCarregando] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [form, setForm] = useState({
    cliente_nome: '',
    cliente_contato: '',
    tipo_servico: 'Casamento',
    data_evento: '',
    data_entrega: '',
    valor_total: '',
    valor_sinal: '',
    status_pagamento: 'pendente',
    observacoes: ''
  });

  useEffect(() => {
    if (edit) {
      setModoEdicao(true);
      buscarDadosDoJob(edit);
    }
  }, [edit]);

  const buscarDadosDoJob = async (id) => {
    try {
      const { data, error } = await supabase.from('servicos').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setForm({
          cliente_nome: data.cliente_nome,
          cliente_contato: data.cliente_contato || '',
          tipo_servico: data.tipo_servico,
          data_evento: data.data_evento ? data.data_evento.split('T')[0] : '',
          data_entrega: data.data_entrega || '',
          valor_total: data.valor_total,
          valor_sinal: data.valor_sinal || '',
          status_pagamento: data.status_pagamento,
          observacoes: data.observacoes || ''
        });
      }
    } catch (error) {
      alert('Erro ao buscar dados: ' + error.message);
    }
  };

  const lidarComMudanca = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setCarregando(true);

    const dadosPayload = {
      cliente_nome: form.cliente_nome,
      cliente_contato: form.cliente_contato,
      tipo_servico: form.tipo_servico,
      data_evento: new Date(form.data_evento).toISOString(),
      data_entrega: form.data_entrega ? form.data_entrega : null,
      valor_total: parseFloat(form.valor_total) || 0,
      valor_sinal: parseFloat(form.valor_sinal) || 0,
      status_pagamento: form.status_pagamento,
      observacoes: form.observacoes
    };

    try {
      if (modoEdicao) {
        const { error } = await supabase.from('servicos').update(dadosPayload).eq('id', edit);
        if (error) throw error;
        alert('🎉 Serviço atualizado com sucesso!');
        router.push('/historico');
      } else {
        const { error } = await supabase.from('servicos').insert([dadosPayload]);
        if (error) throw error;
        alert('🎉 Serviço cadastrado com sucesso!');
        setForm({
          cliente_nome: '', cliente_contato: '', tipo_servico: 'Casamento',
          data_evento: '', data_entrega: '', valor_total: '', valor_sinal: '',
          status_pagamento: 'pendente', observacoes: ''
        });
      }
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 px-4 py-4">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">CRM Premium</span>
        <h1 className="text-xl font-black text-white">{modoEdicao ? 'Atualizar Dados' : 'Novo Serviço / Contrato'}</h1>
      </header>

      <main className="p-4 max-w-md mx-auto">
        <form onSubmit={enviarFormulario} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><User size={14} /> Nome da Cliente</label>
            <input type="text" name="cliente_nome" required placeholder="Ex: Salão Beleza X ou Noiva Ana" value={form.cliente_nome} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><Phone size={14} /> WhatsApp</label>
            <input type="text" name="cliente_contato" placeholder="Ex: (11) 99999-9999" value={form.cliente_contato} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><Video size={14} /> Tipo de Contrato</label>
            <select name="tipo_servico" value={form.tipo_servico} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none">
              <option value="Casamento">💍 Casamento</option>
              <option value="15 anos">✨ Festa de 15 Anos</option>
              <option value="Comercial">🎥 Vídeo Comercial</option>
              <option value="Fixo Semanal">🏪 Fixo Semanal (Salão/Comércio)</option>
              <option value="Design">🎨 Social Media / Design</option>
              <option value="Outros">💼 Outros</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><CalendarIcon size={14} /> {form.tipo_servico === 'Fixo Semanal' ? 'Início do Mês' : 'Data do Evento'}</label>
              <input type="date" name="data_evento" required value={form.data_evento} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-3 text-sm text-white outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><CalendarIcon size={14} /> Entrega / Fim</label>
              <input type="date" name="data_entrega" value={form.data_entrega} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-3 text-sm text-white outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><DollarSign size={14} /> {form.tipo_servico === 'Fixo Semanal' ? 'Valor por Semana' : 'Valor Total'}</label>
              <input type="number" name="valor_total" required step="0.01" placeholder="350.00" value={form.valor_total} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><Percent size={14} /> Quanto deu Sinal?</label>
              <input type="number" name="valor_sinal" step="0.01" placeholder="Ex: 500.00" disabled={form.status_pagamento !== 'sinal_pago'} value={form.status_pagamento === 'sinal_pago' ? form.valor_sinal : ''} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none disabled:opacity-40" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400">Situação Atual do Pagamento</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setForm({ ...form, status_pagamento: 'pendente', valor_sinal: 0 })} className={`py-3 rounded-xl text-xs font-bold border ${form.status_pagamento === 'pendente' ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>🔴 Zero Pago</button>
              <button type="button" onClick={() => setForm({ ...form, status_pagamento: 'sinal_pago' })} className={`py-3 rounded-xl text-xs font-bold border ${form.status_pagamento === 'sinal_pago' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>🟡 Sinal Abatido</button>
              <button type="button" onClick={() => setForm({ ...form, status_pagamento: 'pago', valor_sinal: 0 })} className={`py-3 rounded-xl text-xs font-bold border ${form.status_pagamento === 'pago' ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>🟢 Total Pago</button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5"><FileText size={14} /> Observações</label>
            <textarea name="observacoes" rows="2" placeholder="Notas sobre cronograma ou pacotes..." value={form.observacoes} onChange={lidarComMudanca} className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white outline-none resize-none" />
          </div>

          <button type="submit" disabled={carregando} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
            <Save size={18} />
            <span>{carregando ? 'Processando...' : modoEdicao ? 'Salvar Alterações' : 'Gravar no Sistema'}</span>
          </button>
        </form>
      </main>
    </div>
  );
}