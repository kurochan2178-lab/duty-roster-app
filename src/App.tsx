import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { StaffPage } from './pages/StaffPage';
import { CalendarPage } from './pages/CalendarPage';

import { ResultPage } from './pages/ResultPage';

// Placeholder Pages
const Dashboard = () => (

  <div className="space-y-6">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">ようこそ</h2>
      <p className="text-gray-600">
        左側のメニューから職員の登録、カレンダー設定、シフト作成を行ってください。
      </p>
    </div>
  </div>
);



function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'staff' | 'calendar' | 'result'>('dashboard');

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'staff' && <StaffPage />}
      {currentView === 'calendar' && <CalendarPage />}
      {currentView === 'result' && <ResultPage />}
    </Layout>
  );
}

export default App;
