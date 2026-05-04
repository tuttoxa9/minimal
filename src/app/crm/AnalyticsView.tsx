import { useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface Lead {
  id: string;
  status: string;
  investment_amount?: number;
  budget?: string;
  source?: string;
}

interface AnalyticsViewProps {
  leads: Lead[];
}

export default function AnalyticsView({ leads }: AnalyticsViewProps) {
  const { t } = useLanguage();
  const metrics = useMemo(() => {
    const total = leads.length;
    const closed = leads.filter(l => l.status === 'Успешно закрыта').length;
    const conversion = total > 0 ? Math.round((closed / total) * 100) : 0;
    
    // Пытаемся вытащить сумму из investment_amount или парсим budget, если там только числа
    const revenue = leads
      .filter(l => l.status === 'Успешно закрыта')
      .reduce((sum, l) => {
        let val = Number(l.investment_amount);
        if (isNaN(val) && l.budget) {
          const parsed = parseInt(l.budget.replace(/\D/g, ''));
          if (!isNaN(parsed)) val = parsed;
        }
        return sum + (val || 0);
      }, 0);

    const funnel = {
      'Новая': leads.filter(l => l.status === 'Новая').length,
      'В работе': leads.filter(l => l.status === 'В работе').length,
      'Повторная связь': leads.filter(l => l.status === 'Повторная связь').length,
      'Успешно закрыта': closed,
      'Отказ': leads.filter(l => l.status === 'Отказ').length,
    };

    const sources = leads.reduce((acc: Record<string, number>, l) => {
      const src = l.source || 'Сайт';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {});

    return { total, closed, conversion, revenue, funnel, sources };
  }, [leads]);

  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h2>
        <p className="text-gray-500 mt-2">{t('analytics.subtitle')}</p>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="p-6 bg-white border border-[#F0F0F0] rounded-3xl shadow-sm hover:shadow-md transition-shadow">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('analytics.total_leads')}</p>
           <p className="text-4xl font-bold text-gray-900">{metrics.total}</p>
        </div>
        <div className="p-6 bg-white border border-[#F0F0F0] rounded-3xl shadow-sm hover:shadow-md transition-shadow">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('analytics.deals')}</p>
           <p className="text-4xl font-bold text-green-600">{metrics.closed}</p>
        </div>
        <div className="p-6 bg-white border border-[#F0F0F0] rounded-3xl shadow-sm hover:shadow-md transition-shadow">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('analytics.conversion')}</p>
           <p className="text-4xl font-bold text-blue-600">{metrics.conversion}%</p>
        </div>
        <div className="p-6 bg-white border border-[#F0F0F0] rounded-3xl shadow-sm hover:shadow-md transition-shadow">
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('analytics.revenue')}</p>
           <p className="text-4xl font-bold text-gray-900">${metrics.revenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Funnel & Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="p-8 bg-white border border-[#F0F0F0] rounded-[32px] shadow-sm">
          <h3 className="text-lg font-bold mb-8">{t('analytics.funnel')}</h3>
          <div className="space-y-6">
            {Object.entries(metrics.funnel).map(([status, count]) => {
               const percent = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
               return (
                 <div key={status} className="group">
                   <div className="flex justify-between text-sm mb-2">
                     <span className="font-semibold text-gray-700">{t(`status.${status}`)}</span>
                     <span className="text-gray-500 font-medium">{count} ({percent}%)</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                     <div 
                       className={`h-full rounded-full transition-all duration-1000 ease-out ${
                         status === 'Успешно закрыта' ? 'bg-green-500' : 
                         status === 'Отказ' ? 'bg-red-400' : 'bg-[#111827]'
                       }`} 
                       style={{ width: `${percent}%` }}
                     />
                   </div>
                 </div>
               )
            })}
          </div>
        </div>

        <div className="p-8 bg-white border border-[#F0F0F0] rounded-[32px] shadow-sm">
          <h3 className="text-lg font-bold mb-8">{t('analytics.sources')}</h3>
          <div className="space-y-6">
            {Object.entries(metrics.sources).sort((a,b) => b[1] - a[1]).map(([source, count]) => {
               const percent = metrics.total > 0 ? Math.round((count as number / metrics.total) * 100) : 0;
               return (
                 <div key={source}>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="font-semibold text-gray-700">{source && source !== 'Сайт' ? t(`global.${source}`) !== `global.${source}` ? t(`global.${source}`) : source : t('global.site')}</span>
                     <span className="text-gray-500 font-medium">{count}</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                     <div 
                       className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                       style={{ width: `${percent}%` }}
                     />
                   </div>
                 </div>
               )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
