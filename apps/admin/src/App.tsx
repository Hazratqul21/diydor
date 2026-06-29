import { Navigate, Route, Routes } from 'react-router-dom';
import { getToken } from './lib/api';
import { Layout } from './components/Layout';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Users from './screens/Users';
import Orders from './screens/Orders';
import Reports from './screens/Reports';
import Plans from './screens/Plans';
import Withdrawals from './screens/Withdrawals';
import Settings from './screens/Settings';

function Protected({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/users" element={<Protected><Users /></Protected>} />
      <Route path="/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/reports" element={<Protected><Reports /></Protected>} />
      <Route path="/plans" element={<Protected><Plans /></Protected>} />
      <Route path="/withdrawals" element={<Protected><Withdrawals /></Protected>} />
      <Route path="/settings" element={<Protected><Settings /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
