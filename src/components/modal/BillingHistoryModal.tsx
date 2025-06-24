'use client'

import { Dialog } from '@headlessui/react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface BillingEntry {
  method: string
  referenceId: string
  date: string
  type: string
  currency: string
  amount: number
  remarks: string
}

export default function BillingHistoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const billingData: BillingEntry[] = [
    {
      method: 'Credit Card',
      referenceId: 'PAY123456',
      date: '2025-06-24',
      type: 'Renewal - Gold Membership',
      currency: 'USD',
      amount: 120.0,
      remarks: 'Credit Topup: 1200',
    },
    {
      method: 'PayPal',
      referenceId: 'PAY987654',
      date: '2025-05-10',
      type: 'New - Gold Membership',
      currency: 'USD',
      amount: 99.0,
      remarks: 'Initial subscription',
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
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-background rounded-lg shadow-lg p-6 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold">Billing History</Dialog.Title>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1000px] table-auto text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-2 border">Payment Method</th>
                  <th className="p-2 border">Reference ID</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Type</th>
                  <th className="p-2 border">Currency</th>
                  <th className="p-2 border">Amount Paid</th>
                  <th className="p-2 border">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {billingData.map((entry, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2 border">{entry.method}</td>
                    <td className="p-2 border">{entry.referenceId}</td>
                    <td className="p-2 border">{entry.date}</td>
                    <td className="p-2 border">{entry.type}</td>
                    <td className="p-2 border">{entry.currency}</td>
                    <td className="p-2 border">${entry.amount.toFixed(2)}</td>
                    <td className="p-2 border">{entry.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
