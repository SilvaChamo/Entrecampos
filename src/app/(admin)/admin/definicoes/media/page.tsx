'use client';

import React, { useState } from 'react';
import { Image, Save, Upload, FileType } from 'lucide-react';

export default function DefinicoesMediaPage() {
  const [settings, setSettings] = useState({
    maxUploadSize: 10,
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    autoCompress: true,
    compressQuality: 80,
    createThumbnails: true,
    thumbnailSize: 300
  });

  const toggleFormat = (format: string) => {
    setSettings(prev => ({
      ...prev,
      allowedFormats: prev.allowedFormats.includes(format)
        ? prev.allowedFormats.filter(f => f !== format)
        : [...prev.allowedFormats, format]
    }));
  };

  return (
    <div className="p-6 text-[#2c3338] w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Definições de Media</h1>
          <p className="text-[#50575e] mt-1">Configure as opções de upload e processamento de imagens</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#2271b1]" /> Upload de Ficheiros
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Tamanho Máximo de Upload (MB)</label>
              <input
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => setSettings({...settings, maxUploadSize: parseInt(e.target.value)})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-2">Formatos Permitidos</label>
              <div className="flex flex-wrap gap-2">
                {['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx'].map(format => (
                  <button
                    key={format}
                    onClick={() => toggleFormat(format)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      settings.allowedFormats.includes(format)
                        ? 'bg-[#2271b1] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-[#2271b1]" /> Processamento de Imagens
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Compressão automática</p>
                <p className="text-sm text-[#50575e]">Comprimir imagens no upload</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.autoCompress}
                  onChange={(e) => setSettings({...settings, autoCompress: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>

            {settings.autoCompress && (
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Qualidade da Compressão (%)</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={settings.compressQuality}
                  onChange={(e) => setSettings({...settings, compressQuality: parseInt(e.target.value)})}
                  className="w-full"
                />
                <div className="text-center text-sm text-[#50575e]">{settings.compressQuality}%</div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Criar miniaturas</p>
                <p className="text-sm text-[#50575e]">Gerar versões reduzidas automaticamente</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.createThumbnails}
                  onChange={(e) => setSettings({...settings, createThumbnails: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>

            {settings.createThumbnails && (
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Tamanho da Miniatura (px)</label>
                <input
                  type="number"
                  value={settings.thumbnailSize}
                  onChange={(e) => setSettings({...settings, thumbnailSize: parseInt(e.target.value)})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
