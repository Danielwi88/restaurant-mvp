import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogoutDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '@/services/queries/auth';
import { useQueryClient } from '@tanstack/react-query';
import { MapPinIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type StoredUser = { name?: string; avatar?: string; avatarUrl?: string };

export default function Profile() {
  const { data, isLoading } = useProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
  });

  const [user, setUser] = useState<StoredUser | null>(null);
  const name = user?.name || 'John Doe';
  const avatarUrl = user?.avatarUrl ?? user?.avatar ?? null;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    qc.clear();
    toast.success('Logged out successfully');
    nav('/');
  };

  useEffect(() => {
    if (data)
      setForm((f) => ({
        ...f,
        name: data.name,
        email: data.email,
        phone: data.phone,
      }));
  }, [data]);

  const submit = async () => {
    try {
      await update.mutateAsync({
        name: form.name.trim(),
        phone: form.phone.trim(),
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });
      setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-8 lg:px-0 lg:mx-auto grid md:grid-cols-[240px_1fr] gap-8">
        <aside className='hidden sm:block w-[240px]'>
          <Card className='rounded-2xl shadow-sm'>
            <CardContent className='p-0 space-y-12'>
              <div className='flex items-center gap-3'>
                <Avatar className='size-10 sm:size-12 shrink-0 aspect-square bg-black p-0'>
                  <AvatarImage
                    src={avatarUrl}
                    alt={name}
                    className='object-contain object-center'
                  />
                </Avatar>
                <div className='font-medium'>{form.name || 'User'}</div>
              </div>

              <div className='space-y-6 text-sm'>
                <div className='flex items-center gap-2 text-gray-950 cursor-pointer'>
                  <MapPinIcon className='size-5' /> Delivery Address
                </div>
                <button
                  onClick={() => (window.location.href = '/orders')}
                  className='flex items-center gap-2 text-gray-950 cursor-pointer'
                >
                  <img src='/file-05.svg' alt='file' width='20' height='20' />{' '}
                  My Orders
                </button>
                <button
                  onClick={() => setLogoutOpen(true)}
                  className=' cursor-pointer flex items-center gap-2 text-gray-950'
                >
                  <img
                    src='/arrow-circle-broken-left.svg'
                    alt='arrow'
                    width='20'
                    height='20'
                  />{' '}
                  Logout
                </button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="w-full min-w-0 md:max-w-[524px] lg:w-[524px]">
          <h2 className='w-full text-2xl sm:text-[32px] font-extrabold mb-6'>
            Profile
          </h2>
          <Card className='rounded-2xl shadow-sm'>
            <CardContent className='p-1'>
              <Avatar className='size-16 shrink-0 aspect-square bg-black p-0'>
                <AvatarImage
                  src={avatarUrl}
                  alt={name}
                  className='object-contain object-center'
                />
              </Avatar>
              {isLoading ? (
                <div className='text-zinc-500'>Loading profile…</div>
              ) : (
                <div className='flex flex-col'>
                  <div className='flex justify-between '>
                    <Label className='text-[16px] font-medium text-gray-950 min-w-25' htmlFor='name'>Name</Label>
                    <Input
                      className='text-end shadow-none border-none text-gray-950 font-bold text-[16px]'
                      id='name'
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className='flex'>
                    <Label className='text-[16px] font-medium text-gray-950' htmlFor='email'>Email</Label>
                    <Input
                      className='text-end shadow-none border-none text-gray-950 font-bold text-[16px] read-only:opacity-100 read-only:cursor-text'
                      id='email'
                      value={form.email}
                      readOnly
                    />
                  </div>

                  <div className='flex'>
                    <Label className='text-[16px] font-medium text-gray-950 min-w-30' htmlFor='phone'>Phone Number</Label>
                    <Input
                    className='text-end shadow-none border-none text-[16px] font-bold text-gray-950'
                      id='phone'
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                    />
                  </div>


                  
                  {/* <div>
                    <Label htmlFor='current'>Current Password</Label>
                    <Input
                      id='current'
                      type='password'
                      value={form.currentPassword}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='new'>New Password</Label>
                    <Input
                      id='new'
                      type='password'
                      value={form.newPassword}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, newPassword: e.target.value }))
                      }
                    />
                  </div> */}
                  <div className='sm:col-span-2 mt-2'>
                    <Button
                      className='w-full rounded-full'
                      onClick={submit}
                      disabled={update.isPending}
                    >
                      {' '}
                      {update.isPending ? 'Saving…' : 'Update Profile'}{' '}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
      <LogoutDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={logout}
      />
      <Footer />
    </>
  );
}
