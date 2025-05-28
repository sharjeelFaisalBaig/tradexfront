"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

const Login = () => {
  const router = useRouter()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Login Successful",
      description: "Welcome to Tradex AI!",
    });
    router.replace("/dashboard");
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google Login",
      description: "Google OAuth integration would go here",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3 text-center">
          <p className="text-cyan-700 dark:text-cyan-300 text-sm flex items-center justify-center gap-2">
            <span className="w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">i</span>
            </span>
            Login with Tradex AI
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Please sign in to continue</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full mb-6 h-12 text-base"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center text-sm text-gray-500 mb-6">OR</div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked: any) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm">Remember me</Label>
                </div>
                <Link href="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-500">
                  Forgot Password
                </Link>
              </div>

              <Button type="submit" className="w-full h-12 bg-cyan-600 hover:bg-cyan-700">
                Sign In
              </Button>
            </form>

            <div className="text-center mt-6">
              <span className="text-sm text-gray-600">Donot have an account? </span>
              <Link href="/register" className="text-sm text-cyan-600 hover:text-cyan-500">
                Sign up now
              </Link>
            </div>

            <div className="text-center mt-6 text-xs text-gray-500">
              By continuing, you agree to our{" "}
              <a href="#" className="text-cyan-600 hover:text-cyan-500">Terms of Service</a>,{" "}
              <a href="#" className="text-cyan-600 hover:text-cyan-500">Privacy</a> and{" "}
              <a href="#" className="text-cyan-600 hover:text-cyan-500">Refund Policy</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
