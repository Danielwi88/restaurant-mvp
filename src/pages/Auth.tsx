// src/pages/Auth.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLogin, useRegister } from "@/services/queries/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Auth() {
  const [tab, setTab] = useState<"in"|"up">("in");
  const login = useLogin(); const register = useRegister();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  useEffect(() => {
    const mode = sp.get("mode");
    if (mode === "up") setTab("up");
    if (mode === "in") setTab("in");
  }, [sp]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (tab==="in") {
      await login.mutateAsync({ email:String(f.get("email")||""), password:String(f.get("password")||"") });
      nav("/");
    } else {
      await register.mutateAsync({
        name:String(f.get("name")||""), phone:String(f.get("phone")||""),
        email:String(f.get("email")||""), password:String(f.get("password")||""),
      });
      setTab("in");
    }
  };

  return (
    <div className="grid md:grid-cols-2 min-h-screen">
      <img src="/burger-login.png" alt="burger-login" className="hidden md:block h-full w-full object-cover" />
      <div className="flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="text-2xl font-semibold">Welcome Back</div>
            <p className="text-sm text-zinc-500 mb-4">Good to see you again! Let’s eat</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button variant={tab==="in"?"default":"outline"} onClick={()=>setTab("in")}>Sign in</Button>
              <Button variant={tab==="up"?"default":"outline"} onClick={()=>setTab("up")}>Sign up</Button>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              {tab==="up" && (
                <>
                  <Input name="name" placeholder="Name" required />
                  <Input name="phone" placeholder="Phone" required />
                </>
              )}
              <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
              <Input name="password" type="password" placeholder="Password" required autoComplete="current-password" />
              <Button className="w-full">{tab==="in"?"Login":"Register"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
