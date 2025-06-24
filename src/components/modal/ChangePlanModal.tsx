'use client'

import { Dialog } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import clsx from 'clsx'
import { X } from 'lucide-react'

type PlanStatus = 'Subscribed' | 'Subscribe Now' | 'Renew'

interface Plan {
  name: string
  price: string
  userLimit: string
  features: string[]
  status: PlanStatus
  recommended?: boolean
}

export default function ChangePlanModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [billingType, setBillingType] = useState<'monthly' | 'yearly'>('monthly')

  const plans: Plan[] = [
    {
      name: 'Lite',
      price: '$29',
      userLimit: 'Up to 5 users',
      features: ['Unlimited sending', 'Email marketing', 'Send newsletters'],
      status: 'Subscribe Now',
    },
    {
      name: 'Plus',
      price: '$89',
      userLimit: 'Up to 25 users',
      features: ['Unlimited sending', 'Email marketing', 'Send newsletters'],
      status: 'Subscribed',
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: '$159',
      userLimit: 'Up to 50 users',
      features: ['Unlimited sending', 'Email marketing', 'Send newsletters'],
      status: 'Renew',
    },
  ]

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={clsx(
                  'border rounded-xl p-6 text-center transition-all shadow-sm',
                  plan.recommended
                    ? 'bg-primary text-white border-primary dark:bg-background dark:border-border'
                    : 'bg-white text-foreground border-border dark:bg-muted/50'
                )}
              >
                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <p className="text-3xl font-bold mb-2">
                  {plan.price}
                  <span className="text-base font-medium"> /month</span>
                </p>

                <ul
                  className={clsx(
                    'text-sm mb-6 space-y-2 text-left mt-4',
                    plan.recommended ? 'text-white/90' : 'text-muted-foreground'
                  )}
                >
                  {plan.features.map((feature) => (
                    <li key={feature}>✔ {feature}</li>
                  ))}
                  <li>👥 {plan.userLimit}</li>
                </ul>

                <Button
                  className={clsx('w-full', plan.status === 'Subscribed' && 'text-black dark:text-white')}
                  variant={
                    plan.status === 'Subscribed'
                      ? 'outline'
                      : plan.status === 'Renew'
                      ? plan.recommended
                        ? 'secondary'
                        : 'default'
                      : 'secondary'
                  }
                  disabled={plan.status === 'Subscribed'}
                >
                  {plan.status}
                </Button>
              </div>
            ))}
          </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
