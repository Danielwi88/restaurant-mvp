// src/pages/Auth.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLogin, useRegister } from '@/services/queries/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Auth() {
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const login = useLogin();
  const register = useRegister();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  useEffect(() => {
    const mode = sp.get('mode');
    if (mode === 'up') setTab('up');
    if (mode === 'in') setTab('in');
  }, [sp]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (tab === 'in') {
      await login.mutateAsync({
        email: String(f.get('email') || ''),
        password: String(f.get('password') || ''),
      });
      nav('/');
    } else {
      await register.mutateAsync({
        name: String(f.get('name') || ''),
        phone: String(f.get('phone') || ''),
        email: String(f.get('email') || ''),
        password: String(f.get('password') || ''),
      });
      setTab('in');
    }
  };

  return (
    <div className='grid md:grid-cols-2 gap-5 min-h-screen'>
      <img
        src='/burger-login.png'
        alt='burger-login'
        className='hidden md:block h-full w-full object-cover'
      />
      <div className='flex items-center justify-center  p-6'>
        <Card className='max-w-md border-none shadow-none w-full'>
          <CardContent className='p-6'>
            <div className='flex gap-[15px] mb-4 sm:mb-5'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='size-10 sm:size-[42px] font-semibold text-lg flex items-center  text-brand'
                
                viewBox='0 0 42 42'
                fill='none'
              >
                <mask
                  id='mask0_39423_4673'
                  style={{ maskType: 'luminance' }}
                  maskUnits='userSpaceOnUse'
                  x='0'
                  y='0'
                  width='42'
                  height='42'
                >
                  <path d='M42 0H0V42H42V0Z' fill='white' />
                </mask>
                <g mask='url(#mask0_39423_4673)'>
                  <path
                    fillRule='evenodd'
                    clipRule='evenodd'
                    d='M22.5 0H19.5V13.2832L14.524 0.967222L11.7425 2.09104L16.8474 14.726L7.21142 5.09009L5.09011 7.21142L14.3257 16.447L2.35706 11.2178L1.15596 13.9669L13.8202 19.5H0V22.5H13.8202L1.15597 28.0331L2.35706 30.7822L14.3257 25.553L5.09011 34.7886L7.21142 36.9098L16.8474 27.274L11.7425 39.909L14.524 41.0327L19.5 28.7169V42H22.5V28.7169L27.476 41.0327L30.2574 39.909L25.1528 27.274L34.7886 36.9098L36.9098 34.7886L27.6742 25.553L39.643 30.7822L40.8439 28.0331L28.1799 22.5H42V19.5H28.1797L40.8439 13.9669L39.643 11.2178L27.6742 16.447L36.9098 7.2114L34.7886 5.09009L25.1528 14.726L30.2574 2.09104L27.476 0.967222L22.5 13.2832V0Z'
                    fill='currentColor'
                  />
                </g>
              </svg>
              <h1 className='text-[32px] font-extrabold'>Foody</h1>
            </div>
            <div className='text-2xl font-semibold mb-4 sm:mb-5'>Welcome Back</div>
            <p className='text-sm text-zinc-500 mb-4 sm:mb-5'>
              Good to see you again! Let's eat
            </p>
            <div className='grid grid-cols-2 gap-2 mb-4 sm:mb-5'>
              <Button
                variant={tab === 'in' ? 'default' : 'outline'}
                onClick={() => setTab('in')}
              >
                Sign in
              </Button>
              <Button
                variant={tab === 'up' ? 'default' : 'outline'}
                onClick={() => setTab('up')}
              >
                Sign up
              </Button>
            </div>

            <form onSubmit={onSubmit} className='space-y-3'>
              {tab === 'up' && (
                <>
                  <Input name='name' placeholder='Name' required />
                  <Input name='phone' placeholder='Phone' required />
                </>
              )}
              <Input
                name='email'
                type='email'
                placeholder='Email'
                required
                autoComplete='email'
              />
              <Input
                name='password'
                type='password'
                placeholder='Password'
                required
                autoComplete='current-password'
              />
              <Button className='w-full'>
                {tab === 'in' ? 'Login' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
