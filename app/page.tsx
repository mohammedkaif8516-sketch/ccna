import { Suspense } from 'react'
import CcnaStudyApp from '@/components/ccna-study-app'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CcnaStudyApp />
    </Suspense>
  )
}