import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ApplicationsPage } from './pages/ApplicationsPage.tsx';
import { JourneysPage } from './pages/JourneysPage.tsx';
import { JourneyDetailPage } from './pages/JourneyDetailPage.tsx';
import { RunJourneyPage } from './pages/RunJourneyPage.tsx';
import { ReportPage } from './pages/ReportPage.tsx';

export default function App() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/journeys" element={<JourneysPage />} />
          <Route path="/journeys/:id" element={<JourneyDetailPage />} />
          <Route path="/run" element={<RunJourneyPage />} />
          <Route path="/reports/:journeyId" element={<ReportPage />} />
        </Routes>
      </div>
    </div>
  );
}
