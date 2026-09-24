'use client'

import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login page gets no sidebar — standalone auth screen
  if (pathname === '/admin/login') {
    return <div className="mission-bg min-h-screen">{children}</div>
  }

  return (
    <div className="mission-bg min-h-screen flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}
