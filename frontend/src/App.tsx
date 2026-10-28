import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StationProvider } from './context/StationContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastPage } from './pages/ForecastPage';
import { TrappingPage } from './pages/TrappingPage';
import { StationsPage } from './pages/StationsPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { AboutPage } from './pages/AboutPage';

export function App() {
  return (
    <StationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="trapping" element={<TrappingPage />} />
            <Route path="stations" element={<StationsPage />} />
            <Route path="evaluation" element={<EvaluationPage />} />
            <Route path="sources" element={<DataSourcesPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StationProvider>
  );
}

export default App;
