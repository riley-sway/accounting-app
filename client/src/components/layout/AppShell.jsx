import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell() {
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar search={search} onSearch={setSearch} onMenuClick={() => setSidebarOpen(true)} />
      <main
        className="md:ml-[280px] pt-[72px] px-4 md:px-12 pb-12 min-h-screen"
      >
        <div className="max-w-[1400px] mx-auto py-8">
          <Outlet context={{ search }} />
        </div>
      </main>
    </div>
  )
}
