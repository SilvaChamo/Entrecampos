'use client';

import React, { useState } from 'react';
import { Code, Save, Key, Webhook, Copy, RefreshCw, Trash2 } from 'lucide-react';

export default function DefinicoesAPIPage() {
  const [apiKey, setApiKey] = useState('ec_live_sk_1234567890abcdef');
  const [webhooks, setWebhooks] = useState([
    { id: 1, url: 'https://example.com/webhook', event: 'news.created', active: true },
    { id: 2, url: 'https://example.com/user-webhook', event: 'user.registered', active: false }
  ]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'news.created' });

  const regenerateKey = () => {
    const newKey = 'ec_live_sk_' + Math.random().toString(36).substring(2, 18);
    setApiKey(newKey);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API Key copiada!');
  };

  const addWebhook = () => {
    if (newWebhook.url) {
      setWebhooks([...webhooks, { 
        id: Date.now(), 
        url: newWebhook.url, 
        event: newWebhook.event, 
        active: true 
      }]);
      setNewWebhook({ url: '', event: 'news.created' });
    }
  };

  const toggleWebhook = (id: number) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
  };

  const deleteWebhook = (id: number) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  return (
    <div className="p-6 text-[#2c3338] w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">API & Integrações</h1>
          <p className="text-[#50575e] mt-1">Configure chaves de API e webhooks</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>

      <div className="space-y-6">
        {/* API Key */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-[#2271b1]" /> Chave de API
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">API Key (Live)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiKey}
                  readOnly
                  className="flex-1 h-10 px-3 border border-[#ccd0d4] rounded-md bg-gray-50 font-mono text-sm"
                />
                <button 
                  onClick={copyKey}
                  className="px-3 py-2 border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7]"
                  title="Copiar"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={regenerateKey}
                  className="px-3 py-2 border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7] text-[#d63638]"
                  title="Regenerar"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#50575e] mt-1">Use esta chave para autenticar as suas requisições à API</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Atenção:</strong> Mantenha a sua API Key segura. Não a partilhe em código client-side ou repositórios públicos.
              </p>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-[#2271b1]" /> Documentação da API
          </h2>
          
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <p className="text-[#50575e] mb-1">// Exemplo: Listar notícias</p>
              <p className="text-[#2271b1]">GET</p>
              <p className="text-[#1d2327]">https://api.entrecampos.co.mz/v1/news</p>
              <p className="text-[#50575e] mt-2">Headers:</p>
              <p className="text-[#1d2327]">Authorization: Bearer {apiKey}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <p className="text-[#50575e] mb-1">// Exemplo: Criar notícia</p>
              <p className="text-[#2271b1]">POST</p>
              <p className="text-[#1d2327]">https://api.entrecampos.co.mz/v1/news</p>
              <p className="text-[#50575e] mt-2">Body:</p>
              <p className="text-[#1d2327]">{`{"title": "Nova Notícia", "content": "..."}`}</p>
            </div>

            <a 
              href="#" 
              className="inline-flex items-center gap-2 text-[#2271b1] hover:underline"
            >
              Ver documentação completa →
            </a>
          </div>
        </div>

        {/* Webhooks */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-[#2271b1]" /> Webhooks
          </h2>
          
          <p className="text-sm text-[#50575e] mb-4">
            Receba notificações em tempo real quando eventos ocorrerem no sistema.
          </p>

          {/* Add Webhook */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  type="url"
                  placeholder="URL do webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newWebhook.event}
                  onChange={(e) => setNewWebhook({...newWebhook, event: e.target.value})}
                  className="flex-1 h-10 px-3 border border-[#ccd0d4] rounded-md"
                >
                  <option value="news.created">Notícia criada</option>
                  <option value="news.updated">Notícia atualizada</option>
                  <option value="user.registered">Utilizador registado</option>
                  <option value="user.login">Login</option>
                </select>
                <button 
                  onClick={addWebhook}
                  className="px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Webhook List */}
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div 
                key={webhook.id} 
                className="flex items-center justify-between p-3 border border-[#ccd0d4] rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1d2327] truncate">{webhook.url}</p>
                  <p className="text-sm text-[#50575e]">{webhook.event}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={webhook.active}
                      onChange={() => toggleWebhook(webhook.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2271b1]"></div>
                  </label>
                  <button 
                    onClick={() => deleteWebhook(webhook.id)}
                    className="p-1 text-[#d63638] hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4">Limites de Requisições</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#2271b1]">1000</p>
              <p className="text-sm text-[#50575e]">Requisições/hora</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#2271b1]">100</p>
              <p className="text-sm text-[#50575e]">Uploads/hora</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#2271b1]">10MB</p>
              <p className="text-sm text-[#50575e]">Tamanho máximo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
