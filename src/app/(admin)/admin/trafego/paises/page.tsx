'use client';

import React, { useState } from 'react';
import { Globe, Users, MapPin, TrendingUp, Search } from 'lucide-react';

export default function TrafegoPaisesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const countries = [
    { code: 'MZ', name: 'Moçambique', flag: '🇲🇿', visitors: 32456, percentage: 68.5, change: '+15%' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', visitors: 5234, percentage: 11.0, change: '+8%' },
    { code: 'BR', name: 'Brasil', flag: '🇧🇷', visitors: 3890, percentage: 8.2, change: '+12%' },
    { code: 'ZA', name: 'África do Sul', flag: '🇿🇦', visitors: 2156, percentage: 4.5, change: '+5%' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', visitors: 1456, percentage: 3.1, change: '+3%' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', visitors: 678, percentage: 1.4, change: '-2%' },
    { code: 'TZ', name: 'Tanzânia', flag: '🇹🇿', visitors: 523, percentage: 1.1, change: '+1%' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', visitors: 456, percentage: 1.0, change: '+4%' },
    { code: 'GB', name: 'Reino Unido', flag: '🇬🇧', visitors: 345, percentage: 0.7, change: '+2%' },
    { code: 'DE', name: 'Alemanha', flag: '🇩🇪', visitors: 234, percentage: 0.5, change: '-1%' },
  ];

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVisitors = countries.reduce((acc, c) => acc + c.visitors, 0);

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d2327]">Visitantes por País</h1>
        <p className="text-[#50575e] mt-1">Distribuição geográfica do tráfego</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2271b1]/10 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#2271b1]" />
            </div>
            <div>
              <p className="text-sm text-[#50575e]">Total de Países</p>
              <p className="text-2xl font-bold text-[#1d2327]">47</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[#50575e]">Total de Visitantes</p>
              <p className="text-2xl font-bold text-[#1d2327]">{totalVisitors.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[#50575e]">Crescimento Mensal</p>
              <p className="text-2xl font-bold text-green-600">+18.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#50575e]" />
          <input
            type="text"
            placeholder="Pesquisar país..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
          />
        </div>
      </div>

      {/* Lista de Países */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">País</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Visitantes</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Percentagem</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Tendência</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[#50575e]">Barra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {filteredCountries.map(country => (
              <tr key={country.code} className="hover:bg-[#f6f7f7]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="font-medium text-[#1d2327]">{country.name}</p>
                      <p className="text-xs text-[#50575e]">{country.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#1d2327] font-medium">
                  {country.visitors.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-[#50575e]">
                  {country.percentage}%
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${country.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {country.change}
                  </span>
                </td>
                <td className="px-4 py-3 w-48">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2271b1] rounded-full"
                      style={{ width: `${country.percentage}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mapa Placeholder */}
      <div className="mt-6 bg-white border border-[#ccd0d4] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#2271b1]" /> Mapa de Visitantes
        </h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Globe className="w-12 h-12 text-[#ccd0d4] mx-auto mb-2" />
            <p className="text-[#50575e]">Mapa interativo de visitantes</p>
            <p className="text-sm text-[#50575e]">(Integração com mapa em desenvolvimento)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
