import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SentimentPoint } from '../types';

interface SentimentChartProps {
  data: SentimentPoint[];
  onPointClick?: (timePoint: string) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SentimentPoint;
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl max-w-[280px] ring-1 ring-slate-900/5 z-50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${data.score >= 70 ? 'bg-emerald-50 text-emerald-600' : data.score >= 40 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            {data.score} Score
          </span>
        </div>
        <p className="text-sm text-slate-700 font-medium leading-snug">
          {data.context}
        </p>
      </div>
    );
  }
  return null;
};

const SentimentChart: React.FC<SentimentChartProps> = ({ data, onPointClick }) => {
  const handleClick = (state: any) => {
    if (state && state.activeLabel && onPointClick) {
      onPointClick(state.activeLabel);
    }
  };

  return (
    <div className={`h-64 w-full relative ${onPointClick ? 'cursor-pointer' : ''}`} style={{ minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="100%" debounce={50}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          onClick={handleClick}
        >
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="timePoint"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorScore)"
            animationDuration={1500}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1', fillOpacity: 1 }}
            activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentChart;