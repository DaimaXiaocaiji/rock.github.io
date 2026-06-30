import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Acquisition from '@/pages/Acquisition'
import Analysis from '@/pages/Analysis'
import Visualize from '@/pages/Visualize'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/acquisition" element={<Acquisition />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/visualize" element={<Visualize />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
