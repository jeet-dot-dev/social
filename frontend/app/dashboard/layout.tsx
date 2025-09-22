import DashboardLayout from '@/components/dashboard/DashboardLayout'
import React, { ReactNode } from 'react'

const layout = ({children}:{children : ReactNode}) => {
  return (
    <DashboardLayout>
        {children}
    </DashboardLayout>
  )
}

export default layout