'use client';

import React, { useState } from 'react';
import { Database, Download, Upload, Calendar, Clock, Save, Trash2 } from 'lucide-react';

export default function DefinicoesBackupPage() {
  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    keepBackups: 7,
    includeMedia: true,
    lastBackup: '2026-04-26 02:00:00'
  });

  const backups = [
    { id: 1, date: '2026-04-26 02:00', size: '156 MB', type: 'Automático' },
    { id: 2, date: '2026-04-25 02:00', size: '154 MB', type: 'Automático' },
    { id: 3, date: '2026-04-24 02:00', size: '153 MB', type: 'Automático' },
    { id: 4, date: '2026-04-20 14:30', size: '150 MB', type: 'Manual' },
  ];

  return (
    <div className="p-6 text-[#2c3338] w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Backup e Restauração</h1>
          <p className="text-[#50575e] mt-1">Configure backups automáticos e restaure dados</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>

      <div className="space-y-6">
        {/* Backup Now */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Backup Manual</h2>
              <p className="text-green-100">Último backup: {settings.lastBackup}</p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50">
              <Database className="w-5 h-5" /> Fazer Backup Agora
            </button>
          </div>
        </div>

        {/* Auto Backup Settings */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2271b1]" /> Backup Automático
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Ativar backups automáticos</p>
                <p className="text-sm text-[#50575e]">Criar backups periodicamente</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.autoBackup}
                  onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Frequência</label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                >
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diariamente</option>
                  <option value="weekly">Semanalmente</option>
                  <option value="monthly">Mensalmente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Hora</label>
                <input
                  type="time"
                  value={settings.backupTime}
                  onChange={(e) => setSettings({...settings, backupTime: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Manter últimos backups</label>
              <input
                type="number"
                value={settings.keepBackups}
                onChange={(e) => setSettings({...settings, keepBackups: parseInt(e.target.value)})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Incluir media</p>
                <p className="text-sm text-[#50575e]">Fazer backup de imagens e ficheiros</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.includeMedia}
                  onChange={(e) => setSettings({...settings, includeMedia: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Backup List */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2271b1]" /> Histórico de Backups
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Data</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Tamanho</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="px-4 py-3 text-[#1d2327]">{backup.date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        backup.type === 'Automático' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {backup.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#50575e]">{backup.size}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1 text-[#2271b1] hover:bg-blue-50 rounded mr-1" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-[#d63638] hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Restore */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#2271b1]" /> Restaurar Backup
          </h2>
          <div className="border-2 border-dashed border-[#ccd0d4] rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-[#ccd0d4] mx-auto mb-3" />
            <p className="text-[#50575e] mb-2">Arraste um ficheiro de backup ou clique para selecionar</p>
            <input type="file" accept=".zip,.sql" className="hidden" id="restore-file" />
            <label 
              htmlFor="restore-file" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md cursor-pointer hover:bg-[#135e96]"
            >
              Selecionar Ficheiro
            </label>
          </div>
          <p className="text-sm text-[#d63638] mt-2">⚠️ A restauração substituirá todos os dados atuais</p>
        </div>
      </div>
    </div>
  );
}
