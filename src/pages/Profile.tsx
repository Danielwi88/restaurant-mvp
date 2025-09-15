import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOutIcon, MapPinIcon, ReceiptIcon } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/services/queries/auth";
import { showToast } from "@/lib/toast";

export default function Profile() {
  const { data, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState({ name: "", email: "", phone: "", currentPassword: "", newPassword: "" });

  useEffect(() => {
    if (data) setForm((f) => ({ ...f, name: data.name, email: data.email, phone: data.phone }));
  }, [data]);

  const submit = async () => {
    try {
      await update.mutateAsync({ name: form.name.trim(), phone: form.phone.trim(), currentPassword: form.currentPassword || undefined, newPassword: form.newPassword || undefined });
      setForm((f)=>({ ...f, currentPassword: "", newPassword: "" }));
    } catch { showToast('Failed to update profile', 'error'); }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[220px,1fr] gap-6">
        <aside className="hidden md:block">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10"><AvatarFallback>{(form.name||'U').charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                <div className="font-medium">{form.name || 'User'}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-700"><MapPinIcon className="size-4"/> Delivery Address</div>
                <div className="flex items-center gap-2 text-zinc-700"><ReceiptIcon className="size-4"/> My Orders</div>
                <button className="flex items-center gap-2 text-red-600"><LogOutIcon className="size-4"/> Logout</button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Profile</h2>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5">
              {isLoading ? (
                <div className="text-zinc-500">Loading profile…</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e)=>setForm(f=>({...f, phone:e.target.value}))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={form.email} disabled />
                  </div>
                  <div>
                    <Label htmlFor="current">Current Password</Label>
                    <Input id="current" type="password" value={form.currentPassword} onChange={(e)=>setForm(f=>({...f, currentPassword:e.target.value}))} />
                  </div>
                  <div>
                    <Label htmlFor="new">New Password</Label>
                    <Input id="new" type="password" value={form.newPassword} onChange={(e)=>setForm(f=>({...f, newPassword:e.target.value}))} />
                  </div>
                  <div className="sm:col-span-2 mt-2">
                    <Button className="w-full rounded-full" onClick={submit} disabled={update.isPending}> {update.isPending ? 'Saving…' : 'Update Profile'} </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />
    </>
  );
}

