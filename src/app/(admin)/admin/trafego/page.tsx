'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  Users,
  Globe,
  Clock,
  MapPin,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  FileText,
  Flag
} from 'lucide-react';

// Mock data for demonstration
const MOCK_DATA = {
  onlineUsers: 0,
  todayVisitors: 0,
  todayPageViews: 0,
  totalSearchEngines: 248,
  
  trafficByDay: [
    { date: '14/04', visits: 8, visitors: 8 },
    { date: '15/04', visits: 20, visitors: 21 },
    { date: '16/04', visits: 18, visitors: 19 },
    { date: '17/04', visits: 16, visitors: 17 },
    { date: '18/04', visits: 24, visitors: 26 },
    { date: '19/04', visits: 22, visitors: 24 },
    { date: '20/04', visits: 10, visitors: 11 },
    { date: '21/04', visits: 9, visitors: 10 },
    { date: '22/04', visits: 9, visitors: 10 },
    { date: '23/04', visits: 10, visitors: 11 },
    { date: '24/04', visits: 12, visitors: 13 },
    { date: '25/04', visits: 2, visitors: 3 },
    { date: '26/04', visits: 1, visitors: 2 },
    { date: '27/04', visits: 0, visitors: 0 },
  ],
  
  summaryStats: {
    today: { visitors: 0, pageViews: 0 },
    yesterday: { visitors: 1, pageViews: 1 },
    last7Days: { visitors: 39, pageViews: 43 },
    last30Days: { visitors: 189, pageViews: 198 },
    thisYear: { visitors: 433, pageViews: 485 },
    total: { visitors: 791, pageViews: 968 },
    newVisitors: 711,
    returningVisitors: 36,
    bounceRate: '95.1%',
    avgSession: '23m 50s'
  },
  
  trafficByIP: [
    { ip: '41.220.200.163', country: 'Moçambique', city: 'Maputo, Cidade de Maputo', time: '26 Apr 2026 @ 10:44 pm', duration: '00:00:01', hits: 1, flag: 'mz' },
    { ip: '34.72.176.129', country: 'United States', city: 'Council Bluffs, Iowa', time: '25 Apr 2026 @ 07:24 pm', duration: '00:00:01', hits: 1, flag: 'us' },
    { ip: '41.220.200.249', country: 'Moçambique', city: 'Maputo, Cidade de Maputo', time: '25 Apr 2026 @ 10:54 am', duration: '00:00:01', hits: 1, flag: 'mz' },
    { ip: '197.218.116.8', country: 'Moçambique', city: 'Maputo, Cidade de Maputo', time: '24 Apr 2026 @ 10:57 pm', duration: '00:00:01', hits: 1, flag: 'mz' },
    { ip: '41.220.201.67', country: 'Moçambique', city: 'Cidade de Maputo', time: '24 Apr 2026 @ 09:43 pm', duration: '00:01:14', hits: 1, flag: 'mz' },
    { ip: '197.218.118.237', country: 'Moçambique', city: 'Cidade de Maputo', time: '24 Apr 2026 @ 09:38 pm', duration: '00:00:01', hits: 1, flag: 'mz' },
    { ip: '34.122.147.229', country: 'United States', city: 'Council Bluffs, Iowa', time: '24 Apr 2026 @ 08:25 pm', duration: '00:00:01', hits: 1, flag: 'us' },
    { ip: '34.72.176.129', country: 'United States', city: 'Council Bluffs, Iowa', time: '24 Apr 2026 @ 07:25 pm', duration: '00:00:01', hits: 1, flag: 'us' },
    { ip: '34.123.170.104', country: 'United States', city: 'Council Bluffs, Iowa', time: '24 Apr 2026 @ 07:24 pm', duration: '00:00:01', hits: 1, flag: 'us' },
    { ip: '197.218.58.139', country: 'Moçambique', city: 'Cidade de Maputo', time: '24 Apr 2026 @ 03:08 pm', duration: '00:00:01', hits: 1, flag: 'mz' },
  ],
  
  searchEngines: [
    { name: 'Google', total: 138 },
    { name: 'Bing', total: 104 },
    { name: 'Yahoo Search', total: 6 },
  ]
};

const FLAG_ICONS: Record<string, string> = {
  mz: '🇲🇿',
  us: '🇺🇸',
};

export default function TrafegoPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('14');

  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }) + ', ' + now.toLocaleTimeString('pt-PT', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }));
  }, []);

  const getBarHeight = (value: number, max: number) => {
    return Math.max((value / max) * 100, 5);
  };

  const maxVisits = Math.max(...MOCK_DATA.trafficByDay.map(d => d.visits));

  return (
    <div className="p-6 text-[#2c3338] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-700">Visitor Traffic Real Time Statistics pro</h1>
            <p className="text-sm text-gray-500">{currentTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md text-sm hover:bg-[#135e96]">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Online Users */}
        <div className="bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{MOCK_DATA.onlineUsers}</p>
              <p className="text-sm opacity-90 flex items-center gap-2 mt-1">
                <Users className="w-4 h-4" /> Online Users
              </p>
            </div>
            <Users className="w-12 h-12 opacity-20" />
          </div>
        </div>

        {/* Today's Visitors */}
        <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{MOCK_DATA.todayVisitors}</p>
              <p className="text-sm opacity-90 flex items-center gap-2 mt-1">
                <Globe className="w-4 h-4" /> Today&apos;s Visitors
              </p>
            </div>
            <Globe className="w-12 h-12 opacity-20" />
          </div>
        </div>

        {/* Today's Page Views */}
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{MOCK_DATA.todayPageViews}</p>
              <p className="text-sm opacity-90 flex items-center gap-2 mt-1">
                <FileText className="w-4 h-4" /> Today&apos;s Page Views
              </p>
            </div>
            <FileText className="w-12 h-12 opacity-20" />
          </div>
        </div>

        {/* Search Engines */}
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{MOCK_DATA.totalSearchEngines}</p>
              <p className="text-sm opacity-90 flex items-center gap-2 mt-1">
                <Search className="w-4 h-4" /> All Time Search Engines
              </p>
            </div>
            <Search className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" /> Traffic Report
          </h2>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        {/* Chart */}
        <div className="h-64 flex items-end justify-between gap-2 px-4">
          {MOCK_DATA.trafficByDay.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex gap-0.5">
                <div 
                  className="flex-1 bg-blue-400 rounded-t"
                  style={{ height: `${getBarHeight(day.visits, maxVisits)}px` }}
                  title={`Visitas: ${day.visits}`}
                />
                <div 
                  className="flex-1 bg-amber-400 rounded-t"
                  style={{ height: `${getBarHeight(day.visitors, maxVisits)}px` }}
                  title={`Visitantes: ${day.visitors}`}
                />
              </div>
              <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left translate-y-4">{day.date}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded" />
            <span className="text-sm text-gray-600">Visit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-400 rounded" />
            <span className="text-sm text-gray-600">Visitor</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Summary Statistics */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" /> Summary Statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Período</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">Visitors</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">Page Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-gray-700">Today</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.today.visitors}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.today.pageViews}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Yesterday</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.yesterday.visitors}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.yesterday.pageViews}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Last 7 Days</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.last7Days.visitors}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.last7Days.pageViews}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Last 30 Days</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.last30Days.visitors}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.last30Days.pageViews}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">This Year</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.thisYear.visitors}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.thisYear.pageViews}</td>
                </tr>
                <tr className="bg-green-50">
                  <td className="px-4 py-3 text-green-700 font-semibold">Total</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{MOCK_DATA.summaryStats.total.visitors}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-semibold">{MOCK_DATA.summaryStats.total.pageViews}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">New Visitors</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.newVisitors}</td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Returning Visitors</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.returningVisitors}</td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Bounce Rate</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.bounceRate}</td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-700">Avg. Session</td>
                  <td className="px-4 py-3 text-right text-gray-600">{MOCK_DATA.summaryStats.avgSession}</td>
                  <td className="px-4 py-3 text-right text-gray-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Search Engines Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" /> Search Engines Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 font-medium">Engine</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_DATA.searchEngines.map((engine, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-gray-700">{engine.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{engine.total}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-gray-700">Total</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {MOCK_DATA.searchEngines.reduce((sum, e) => sum + e.total, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Traffic by IP */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" /> Last 30 Days Traffic by IP
          </h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm">
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm">
              <Search className="w-4 h-4" /> Pesquisar
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">IP Address</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Location</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Time</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Duration</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">Hits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_DATA.trafficByIP.map((ip, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700 font-mono text-xs">{ip.ip}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{FLAG_ICONS[ip.flag] || '🏳️'}</span>
                      <span className="text-gray-700">{ip.country}</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-7">{ip.city}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{ip.time}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{ip.duration}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white text-xs font-semibold rounded">
                      {ip.hits}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">&lt;</button>
          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">1</button>
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">2</button>
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">3</button>
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">4</button>
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">...</button>
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">19</button>
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">&gt;</button>
        </div>
      </div>
    </div>
  );
}
