import React, { useState } from 'react';
import Sidebar from './layouts/Sidebar';
import Overview from './pages/Overview';
import Simulator from './pages/Simulator';
import ModelIntelligence from './pages/ModelIntelligence';
import ClusterAnalysis from './pages/ClusterAnalysis';
import BatchReports from './pages/BatchReports';

const PAGES = {
  overview: Overview,
  simulator: Simulator,
  models: ModelIntelligence,
  clusters: ClusterAnalysis,
  batch: BatchReports,
};

export default function App() {
  const [activePage, setActivePage] = useState('simulator');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const PageComponent = PAGES[activePage] || Simulator;

  return (
    <div className="flex min-h-screen bg-[#0d0d0e] text-[#ececec]">
      <Sidebar
        active={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <main
        className="flex-1 min-w-0 overflow-y-auto transition-[margin-left] duration-200"
        style={{ marginLeft: sidebarOpen ? '280px' : '72px' }}
      >
        <div className="px-6 py-8 sm:px-10 lg:px-14 lg:py-10 max-w-[1640px] mx-auto">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
