import React, { useMemo } from 'react';
import { Waybill } from '../types';
import { formatDateTime } from '../services/backend';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props { waybills: Waybill[]; }

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open:     { color: '#92600A', bg: '#FEF3C7' },
  closed:   { color: '#1D4ED8', bg: '#DBEAFE' },
  approved: { color: '#166534', bg: '#DCFCE7' },
};
const STATUS_LABELS: Record<string, string> = {
  open: 'Відкрито', closed: 'Закрито', approved: 'Затверджено',
};

export default function Dashboard({ waybills }: Props) {
  const today = new Date().toDateString();
  const todayWBs = waybills.filter(w => new Date(w.createdAt).toDateString() === today);
  const openWBs = waybills.filter(w => w.status === 'open');
  const pendingApproval = waybills.filter(w => w.status === 'closed');

  const thisMonth = new Date();
  const monthWBs = waybills.filter(w => {
    const d = new Date(w.createdAt);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  });
  const hoursSaved = Math.round((monthWBs.length / 1200) * 140);

  const chartData = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('uk-UA', { weekday: 'short', day: 'numeric' }),
        count: waybills.filter(w => new Date(w.createdAt).toDateString() === dateStr).length,
      });
    }
    return days;
  }, [waybills]);

  const recentWBs = [...waybills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Дашборд</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="ШЛ сьогодні"    value={todayWBs.length}        sub="шляхових листів"  bg="#E6EEF4" color="#003A5D" />
        <KpiCard label="Відкриті зміни" value={openWBs.length}         sub="зараз активні"    bg="#FEF3C7" color="#92600A" />
        <KpiCard label="На погодженні"  value={pendingApproval.length} sub="очікують логіста"  bg="#DBEAFE" color="#1D4ED8" />
        <KpiCard label="Заощаджено год." value={hoursSaved}            sub={`за ${thisMonth.toLocaleDateString('uk-UA', { month: 'long' })}`} bg="#DCFCE7" color="#166534" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">ШЛ за останні 7 днів</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barSize={28}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
              formatter={(v: any) => [v, 'ШЛ']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.date === today ? '#003A5D' : '#7AAEC8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* FTE Savings */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Плановий ефект від впровадження</h2>
        <div className="space-y-2">
          {[
            { role: 'Медичний працівник', fte: 0.3, hours: 60 },
            { role: 'Диспетчер', fte: 0.1, hours: 20 },
            { role: 'Механік', fte: 0.3, hours: 60 },
            { role: 'Фахівець диспетчеризації', fte: 1.5, hours: null },
          ].map(({ role, fte, hours }) => (
            <div key={role} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600">{role}</span>
              <div className="flex items-center gap-4">
                {hours && <span className="text-xs text-gray-400">−{hours} год/міс</span>}
                <span className="text-sm font-semibold" style={{ color: '#166534' }}>−{fte} FTE</span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 font-semibold">
            <span className="text-sm text-gray-700">Разом</span>
            <span className="text-sm" style={{ color: '#003A5D' }}>−2.2 FTE</span>
          </div>
        </div>
      </div>

      {/* Recent waybills */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-gray-700">Останні ШЛ</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentWBs.map(wb => (
            <div key={wb.id} className="px-5 py-3 flex items-center justify-between hover:bg-surface transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">{wb.driverName.split(' ').slice(0, 2).join(' ')}</p>
                <p className="text-xs text-gray-400">{wb.vehicleNumber} · {formatDateTime(wb.createdAt)}</p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={STATUS_STYLE[wb.status]}
              >
                {STATUS_LABELS[wb.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, bg, color }: {
  label: string; value: number; sub: string; bg: string; color: string;
}) {
  return (
    <div className="rounded-2xl p-4 border border-transparent" style={{ background: bg }}>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
