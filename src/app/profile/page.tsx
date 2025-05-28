"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";

const Profile = () => {
  const router = useRouter()
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Anderson");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoRenewal, setAutoRenewal] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              onClick={() => router.replace("/dashboard")}
              className="flex items-center gap-2 text-muted-foreground"
            >
              ← Profile Setting
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-56 border-r border-border p-8 flex flex-col items-center bg-background">
          <div className="relative mb-4">
            <Avatar className="w-28 h-28">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face" alt="John Anderson" />
              <AvatarFallback>JA</AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 bg-background p-1 rounded-full border border-border">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M14.5 4h-5L7 7H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold text-foreground">John Anderson</h2>
          <p className="text-muted-foreground text-sm">@johnanderson</p>
        </div>

        {/* Main Form Area */}
        <div className="flex-1 px-6 py-8 max-w-5xl bg-background">
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </section>
          
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Account Preferences</h2>
            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-foreground">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Reveive email updates about your account</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-foreground">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={twoFactor}
                    onCheckedChange={setTwoFactor}
                  />
                </div>
              </div>
            </div>
          </section>
          
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6 text-foreground">Subscription Management</h2>
            <div className="border border-border rounded-lg p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">Current Plan</h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Professional Plan</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">$29.99/month</p>
                    <p className="text-sm text-muted-foreground">Next billing: May 15,2025</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-medium text-foreground">Auto-renewal</h3>
                    <p className="text-sm text-muted-foreground">Automatically renew subscription</p>
                  </div>
                  <Switch
                    checked={autoRenewal}
                    onCheckedChange={setAutoRenewal}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button>Change Plan</Button>
                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800/30 dark:hover:bg-green-800/20">
                  Billing History
                </Button>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-6 text-destructive">Danger Zone</h2>
            <Button variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10">
              Delete Account
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
