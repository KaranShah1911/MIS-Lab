import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AppLayout from './components/Layout/AppLayout';
import AdminDashboard from './pages/AdminDashboard';
import ExecutiveSummary from './pages/ExecutiveSummary';
import Patients from './pages/Patients';
import OPD from './pages/OPD';
import IPD from './pages/IPD';
import Billing from './pages/Billing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone landing page — no sidebar */}
        <Route path="/" element={<Landing />} />

        {/* App shell with sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard"  element={<AdminDashboard />} />
          <Route path="/executive"  element={<ExecutiveSummary />} />
          <Route path="/patients"   element={<Patients />} />
          <Route path="/opd"        element={<OPD />} />
          <Route path="/ipd"        element={<IPD />} />
          <Route path="/billing"    element={<Billing />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
