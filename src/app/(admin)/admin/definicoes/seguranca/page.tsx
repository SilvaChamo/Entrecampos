'use client';

import React, { useState } from 'react';
import { Shield, Save, Lock, Eye, EyeOff, Smartphone } from 'lucide-react';

export default function DefinicoesSegurancaPage() {
  const [settings, setSettings] = useState({
    forceHTTPS: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    requireStrongPassword: true,
    twoFactorAuth: false,
    ipWhitelist: ''
  });

  return (
    <div className="p-6 text-[#2c3338] w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Definições de Segurança</h1>
          <p className="text-[#50575e] mt-1">Configure as opções de segurança do sistema</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#2271b1]" /> Proteção de Acesso
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Forçar HTTPS</p>
                <p className="text-sm text-[#50575e]">Redirecionar todas as requisições para HTTPS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.forceHTTPS}
                  onChange={(e) => setSettings({...settings, forceHTTPS: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Tentativas de Login Máximas</label>
              <input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({...settings, maxLoginAttempts: parseInt(e.target.value)})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              />
              <p className="text-xs text-[#50575e] mt-1">Número de tentativas antes de bloquear</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Duração do Bloqueio (minutos)</label>
              <input
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({...settings, lockoutDuration: parseInt(e.target.value)})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#2271b1]" /> Passwords
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Exigir password forte</p>
                <p className="text-sm text-[#50575e]">Mínimo 8 caracteres, letras, números e símbolos</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.requireStrongPassword}
                  onChange={(e) => setSettings({...settings, requireStrongPassword: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#2271b1]" /> Autenticação de Dois Fatores
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Ativar 2FA</p>
                <p className="text-sm text-[#50575e]">Requerer código adicional no login</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.twoFactorAuth}
                  onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4">Whitelist de IP</h2>
          <div>
            <label className="block text-sm font-medium text-[#1d2327] mb-1">IPs Permitidos (um por linha)</label>
            <textarea
              value={settings.ipWhitelist}
              onChange={(e) => setSettings({...settings, ipWhitelist: e.target.value})}
              rows={4}
              placeholder="192.168.1.1&#10;10.0.0.1"
              className="w-full px-3 py-2 border border-[#ccd0d4] rounded-md font-mono text-sm"
            />
            <p className="text-xs text-[#50575e] mt-1">Deixe em branco para permitir todos os IPs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
