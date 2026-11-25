import { useState } from 'react';
import BestTimes from './BestTimes';
import CommutePlanner from './CommutePlanner';
import RainAlerts from './RainAlerts';

const TABS = [
  { id: 'best-times', label: 'Best Times', icon: '⏰' },
  { id: 'commute',    label: 'Commute',    icon: '🚗' },
  { id: 'rain',       label: 'Rain Alerts',icon: '🌧️' }
];

function PlanningTools({ weatherData, preferences }) {
  const [tab, setTab] = useState('best-times');

  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Planning Tools</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'best-times' && (
          <BestTimes weatherData={weatherData} preferences={preferences} />
        )}
        {tab === 'commute' && (
          <CommutePlanner weatherData={weatherData} preferences={preferences} />
        )}
        {tab === 'rain' && (
          <RainAlerts weatherData={weatherData} preferences={preferences} />
        )}
      </div>
    </section>
  );
}

export default PlanningTools;