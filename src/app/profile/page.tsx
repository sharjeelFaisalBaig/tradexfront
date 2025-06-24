'use client'

import { useState } from 'react'
import Header from './Header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { CameraIcon } from 'lucide-react'
import Image from 'next/image'
import ChangePlanModal from '@/components/modal/ChangePlanModal'
import BillingHistoryModal from '@/components/modal/BillingHistoryModal'

export default function ProfilePage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [autoRenewal, setAutoRenewal] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="relative w-64 border-r border-border p-8 bg-background overflow-hidden flex flex-col items-center">
          <Image
            src="/profilesidenav.png"
            alt="Sidebar Illustration"
            width={256}
            height={256}
            className="absolute bottom-0 left-0 w-[85%] h-auto z-10 pointer-events-none ml-auto"
          />
          <div className="relative z-20 flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-28 h-28">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face" />
                <AvatarFallback>JA</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-1 right-1 bg-white dark:bg-background p-1 rounded-full border border-border shadow-sm">
                <CameraIcon className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <h2 className="text-xl font-semibold mb-1">John Anderson</h2>
            <p className="text-sm text-muted-foreground">@johnanderson</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-12 py-10 overflow-y-auto bg-background">
          {/* Personal Info */}
          <section className="mb-12 max-w-[80%] mr-6">
            <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <InputField label="First Name" value={firstName} setValue={setFirstName} />
              <InputField label="Last Name" value={lastName} setValue={setLastName} />
              <InputField label="Email" value={email} setValue={setEmail} type="email" />
              <InputField label="Phone" value={phone} setValue={setPhone} />
            </div>
          </section>

          {/* Account Preferences */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-6">Account Preferences</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <SwitchCard
                title="Email Notifications"
                description="Receive email updates about your account"
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
              <SwitchCard
                title="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                checked={twoFactor}
                onChange={setTwoFactor}
              />
            </div>
          </section>

          {/* Subscription */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6">Subscription Management</h2>
            <div className="border border-border rounded-lg p-6 bg-white dark:bg-muted/50">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 border border-border rounded-lg flex justify-between gap-6">
                  <div>
                    <h3 className="font-medium mb-1">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">Professional Plan</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400 mb-1">
                      Active
                    </span>
                    <p className="font-semibold">$29.99/month</p>
                    <p className="text-sm text-muted-foreground">Next billing: May 15, 2025</p>
                  </div>
                </div>

                <SwitchCard
                  title="Auto-renewal"
                  description="Automatically renew subscription"
                  checked={autoRenewal}
                  onChange={setAutoRenewal}
                />
              </div>

              <div className="flex gap-3">
                <Button className="bg-[#0088CC] hover:bg-[#0077b3] text-white" onClick={() => setShowPlanModal(true)}>Change Plan</Button>
                <Button
                  variant="outline"
                  className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-800/30 dark:hover:bg-green-800/20"
                  onClick={() => setShowBillingModal(true)}
                >
                  Billing History
                </Button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section>
            <h2 className="text-xl font-semibold text-destructive mb-6">Danger Zone</h2>
            <div className="flex gap-3">
              <Button className="bg-transparent text-destructive border border-destructive hover:bg-destructive/10">
                Delete Account
              </Button>
            </div>
          </section>
          {showPlanModal && (
            <ChangePlanModal
              isOpen={showPlanModal}
              onClose={() => setShowPlanModal(false)}
            />
          )}
          {showBillingModal && (
          <BillingHistoryModal
            isOpen={showBillingModal}
            onClose={() => setShowBillingModal(false)}
          />
        )}
        </main>
      </div>
    </div>
  )
}

// Reusable input field
function InputField({ label, value, setValue, type = 'text' }: { label: string; value: string; setValue: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input type={type} value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  )
}

// Reusable switch card
function SwitchCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="bg-white dark:bg-muted/50 border border-border rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="data-[state=checked]:bg-[#0088CC]"
        />
      </div>
    </div>
  )
}
