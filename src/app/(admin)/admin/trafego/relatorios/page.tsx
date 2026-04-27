'use client';

import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export default function TrafegoRelatoriosPage() {
  const [dateRange, setDateRange] = useState('7d');

  const reports = [
    { id: 1, name: 'Visão Geral de Tráfego', date: '2026-04-26', type: 'PDF', size: '2.3 MB', trend: 'up', change: '+12%' },
    { id: 2, name: 'Análise de Páginas', date: '2026-04-25', type: 'XLSX', size: '856 KB', trend: 'up', change: '+5%' },
    { id: 3, name: 'Fontes de Tráfego', date: '2026-04-24', type: 'PDF', size: '1.2 MB', trend: 'down', change: '-3%' },
    { id: 4, name: 'Comportamento de Utilizadores', date: '2026-04-23', type: 'XLSX', size: '1.5 MB', trend: 'up', change: '+8%' },
    { id: 5, name: 'Dispositivos e Localização', date: '2026-04-22', type: 'PDF', size: '3.1 MB', trend: 'up', change: '+15%' },
  ];

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Relatórios Detalhados</h1>
          <p className="text-[#50575e] mt-1">Análise completa do tráfego do site</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-lg hover:bg-[#135e96]">
          <FileText className="w-4 h-4" /> Gerar Novo Relatório
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border border-[#ccd0d4] rounded-lg p-1">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                dateRange === range
                  ? 'bg-[#2271b1] text-white'
                  : 'text-[#50575e] hover:bg-[#f6f7f7]'
              }`}
            >
              {range === '24h' ? '24 horas' : range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#ccd0d4] rounded-lg hover:bg-[#f6f7f7]">
          <Calendar className="w-4 h-4" /> Personalizado
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Visitas', value: '45,678', change: '+12%', positive: true },
          { label: 'Visitantes Únicos', value: '32,456', change: '+8%', positive: true },
          { label: 'Páginas/Visita', value: '3.2', change: '+5%', positive: true },
          { label: 'Taxa de Rejeição', value: '42%', change: '-3%', positive: true },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-[#ccd0d4] rounded-lg p-4">
            <p className="text-sm text-[#50575e]">{stat.label}</p>
            <div className="flex items-end justify-between mt-1">
              <span className="text-2xl font-bold text-[#1d2327]">{stat.value}</span>
              <span className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de Relatórios */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Relatório</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Data</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Tamanho</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Tendência</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-[#50575e]">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {reports.map(report => (
              <tr key={report.id} className="hover:bg-[#f6f7f7]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#2271b1]" />
                    <span className="font-medium text-[#1d2327]">{report.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#50575e]">{report.date}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-[#50575e] text-xs rounded">
                    {report.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#50575e]">{report.size}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {report.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={report.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {report.change}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="p-2 text-[#2271b1] hover:bg-blue-50 rounded">
                    <Download className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
