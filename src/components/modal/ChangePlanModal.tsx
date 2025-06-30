'use client'

import { Dialog } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { endpoints } from '@/lib/endpoints'
import { useSession } from 'next-auth/react'
import { fetchWithAutoRefresh } from '@/lib/fetchWithAutoRefresh'

export default function ChangePlanModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { data: session } = useSession()
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true)
      try {
        // console.log("Fetching plans with token:", session?.accessToken)
        const data = await fetchWithAutoRefresh(endpoints.PLANS.GET_ALL_PLANS, session)
        // console.log("Plans API response:", data)
        if (data?.status && data?.data?.plans) {
          setPlans(data.data.plans)
        } else {
          setPlans([])
        }
      } catch (e) {
        setPlans([])
        console.error("Error fetching plans:", e)
      }
      setLoading(false)
    }
    if (isOpen && session?.accessToken) fetchPlans()
  }, [isOpen, session?.accessToken])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 w-full h-full" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="relative bg-white dark:bg-background h-full flex flex-col items-center justify-center shadow-lg p-8 w-full ">
          <div className='w-full max-w-5xl'>
            {/* Close Icon */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <Dialog.Title className="text-2xl font-bold text-center mb-2">Choose Your Plan</Dialog.Title>
            <p className="text-sm text-muted-foreground text-center mb-6">No contracts, no surprise fees.</p>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-muted rounded-lg p-1">
                <button
                  className={clsx(
                    'px-4 py-1 text-sm rounded-lg transition-all',
                    billingType === 'monthly'
                      ? 'bg-primary text-white dark:bg-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setBillingType('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={clsx(
                    'px-4 py-1 text-sm rounded-lg transition-all',
                    billingType === 'yearly'
                      ? 'bg-primary text-white dark:bg-background'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setBillingType('yearly')}
                >
                  Yearly
                </button>
              </div>
            </div>

            {/* Plans List */}
            {loading ? (
              <div className="text-center py-12">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 text-red-500">No plans found.</div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-${plans.length > 2 ? 3 : plans.length} gap-6`}>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={clsx(
                      'border rounded-xl p-6 text-center transition-all shadow-sm',
                      'bg-white text-foreground border-border dark:bg-muted/50'
                    )}
                  >
                    <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                    <p className="text-3xl font-bold mb-2">
                      {billingType === 'monthly'
                        ? `$${plan.monthly_price}`
                        : plan.annual_price
                        ? `$${plan.annual_price}`
                        : 'N/A'}
                      <span className="text-base font-medium"> /{billingType}</span>
                    </p>
                    <ul className="text-sm mb-6 space-y-2 text-left mt-4 text-muted-foreground">
                      <li>Credits: {plan.monthly_credits}</li>
                      <li>USD per credit: {plan.usd_per_credit}</li>
                      {plan.description && (
                        <li dangerouslySetInnerHTML={{ __html: plan.description }} />
                      )}
                    </ul>
                    <Button className="w-full">
                      Subscribe
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
