import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
// Apply saved theme before first render
if (localStorage.getItem('sway_theme') === 'dark') {
  document.documentElement.classList.add('dark')
}
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import InvoiceList from './pages/InvoiceList'
import CreateInvoice from './pages/CreateInvoice'
import ClientDirectory from './pages/ClientDirectory'
import Reports from './pages/Reports'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/new" element={<CreateInvoice />} />
            <Route path="invoices/:id/edit" element={<CreateInvoice />} />
            <Route path="clients" element={<ClientDirectory />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '8px',
            background: '#0F172A',
            color: '#fff',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ba1a1a', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  )
}
