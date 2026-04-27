'use client';

import React, { useState } from 'react';
import { 
  Globe, 
  Save,
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export default function DefinicoesGeraisPage() {
  const [formData, setFormData] = useState({
    siteName: 'EntreCAMPOS',
    siteDescription: 'Portal de notícias agrícolas de Moçambique',
    logoUrl: '',
    faviconUrl: '',
    contactEmail: 'admin@entrecampos.co.mz',
    contactPhone: '',
    address: '',
    googleAnalyticsId: '',
    maintenanceMode: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert('Definições guardadas com sucesso!');
  };

  return (
    <div className="p-6 text-[#2c3338] w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Definições Gerais</h1>
          <p className="text-[#50575e] mt-1">Configure as informações básicas do site</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar Alterações
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Site Info */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#2271b1]" /> Informações do Site
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Nome do Site</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Descrição</label>
              <textarea
                value={formData.siteDescription}
                onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#2271b1]" /> Identidade Visual
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Logotipo</label>
              <input
                type="file"
                accept="image/*"
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Favicon</label>
              <input
                type="file"
                accept="image/*"
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#2271b1]" /> Contactos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1 flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1 flex items-center gap-1">
                <Phone className="w-4 h-4" /> Telefone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1d2327] mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1d2327]">Modo de Manutenção</h2>
              <p className="text-sm text-[#50575e]">Ativar modo de manutenção (apenas admins podem aceder)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.maintenanceMode}
                onChange={(e) => setFormData({...formData, maintenanceMode: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
