import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLogin, useRegister } from '@/services/queries/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema
  .extend({
    name: z.string().min(1, 'Name is required'),
    phone: z
      .string()
      .min(8, 'Phone is too short')
      .regex(/^\+?\d[\d\s-]{6,}$/i, 'Enter a valid phone number'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export default function Auth() {
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const login = useLogin();
  const register = useRegister();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const [loginLoading, setLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register: rhfRegister,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SignInValues & Partial<SignUpValues>>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const pwd = watch('password');

  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem('remember_me') === '1';
      const savedEmail = localStorage.getItem('remember_email') || '';
      setRememberMe(savedRemember);
      if (savedRemember && savedEmail)
        setValue('email', savedEmail, { shouldValidate: true });
    } catch (err) {
      console.debug('remember init failed', err);
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Disable vertical scroll while on the Auth page
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const mode = sp.get('mode');
    if (mode === 'up') setTab('up');
    if (mode === 'in') setTab('in');
    // clear field errors/values when switching from link
    reset({
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  }, [sp, reset]);

  const onSubmit = handleSubmit(
    async (values: SignInValues & Partial<SignUpValues>) => {
      try {
        if (tab === 'in') {
          const parsed = signInSchema.parse({
            email: values.email,
            password: values.password,
          });
          setLoginLoading(true);
          await login.mutateAsync(parsed);
          // persist remember me preference & email
          try {
            if (rememberMe) {
              localStorage.setItem('remember_me', '1');
              localStorage.setItem('remember_email', parsed.email);
            } else {
              localStorage.removeItem('remember_me');
              localStorage.removeItem('remember_email');
            }
          } catch (err) {
            console.debug('remember persist failed', err);
          }
          toast.success('Login successful. Welcome back!');
          nav('/');
        } else {
          const parsed = signUpSchema.parse({
            name: values.name ?? '',
            phone: values.phone ?? '',
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword ?? '',
          });
          await register.mutateAsync({
            name: parsed.name,
            phone: parsed.phone,
            email: parsed.email,
            password: parsed.password,
          });
          toast.success('Registration successful. Please sign in.');
          setTab('in');
          reset({
            name: '',
            phone: '',
            email: parsed.email,
            password: '',
            confirmPassword: '',
          });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Something went wrong';
        if (tab === 'in') {
          toast.error(`Login failed: ${message}`);
        } else {
          toast.error(`Registration failed: ${message}`);
        }
      } finally {
        if (tab === 'in') setLoginLoading(false);
      }
    }
  );

  return (
    <div className='grid md:grid-cols-2 gap-5 h-[100dvh] overflow-hidden'>
      <img
        src='/burger-login.png'
        alt='burger-login'
        className='hidden md:block h-[100dvh] w-full object-cover'
      />
      <div
        className={`flex justify-center p-6 ${
          tab === 'up' ? 'md:mt-[151px]' : 'md:mt-[272px]'
        }`}
      >
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
              <h1 className='text-[32px] text-gray-950 font-extrabold sm:leading-[42px]'>
                Foody
              </h1>
            </div>
            <div className='text-gray-950 text-2xl sm:text-[28px]  leading-[36px] sm:leading-[38px] font-extrabold mb-4'>
              Welcome Back
            </div>
            <p className='text-sm sm:text-md leading-[28px] sm:leading-[30px] font-normal text-gray-950 mb-4 sm:mb-5'>
              Good to see you again! Let's eat
            </p>
            <div className='grid grid-cols-2 gap-2 mb-4 sm:mb-5 text-sm sm:text-md bg-gray-100 w-full h-12 sm:h-[56px] items-center px-2 rounded-2xl'>
              <Button
                variant={tab === 'in' ? 'default' : 'outline'}
                onClick={() => setTab('in')}
                className={`h-9 sm:h-10 rounded-md sm:rounded-xl border-none shadow-none cursor-pointer ${
                  tab === 'in'
                    ? 'bg-white text-gray-950 hover:bg-white hover:font-bold'
                    : 'bg-transparent text-gray-600 hover:bg-white hover:text-gray-950'
                }`}
              >
                Sign in
              </Button>
              <Button
                variant={tab === 'up' ? 'default' : 'outline'}
                onClick={() => setTab('up')}
                className={`h-9 sm:h-10 rounded-md sm:rounded-xl border-none shadow-none cursor-pointer ${
                  tab === 'up'
                    ? 'bg-white text-gray-950 hover:bg-white hover:font-bold'
                    : 'bg-transparent text-gray-600 hover:bg-white hover:text-gray-950'
                }`}
              >
                Sign up
              </Button>
            </div>

            <form
              onSubmit={onSubmit}
              className=' space-y-4 sm:space-y-5 h-12 sm:h-[56px] '
            >
              {tab === 'up' && (
                <>
                  <div className='relative'>
                    <Input
                      id='name'
                      placeholder=' '
                      className='peer h-12 sm:h-14 pt-4 sm:pt-5'
                      {...rhfRegister('name', {
                        validate: (v) =>
                          tab === 'up' && !v ? 'Name is required' : true,
                      })}
                    />
                    <label
                      htmlFor='name'
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-600 peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600 bg-transparent px-1'
                    >
                      Name
                    </label>
                  </div>
                  {errors.name?.message && (
                    <p className='text-xs -mt-3 text-red-500'>
                      {String(errors.name.message)}
                    </p>
                  )}

                  <div className='relative'>
                    <Input
                      id='phone'
                      placeholder=' '
                      className='peer h-12 sm:h-14 pt-4 sm:pt-5'
                      {...rhfRegister('phone', {
                        validate: (v) => {
                          if (tab !== 'up') return true;
                          if (!v) return 'Phone is required';
                          return /^\+?\d[\d\s-]{6,}$/i.test(v)
                            ? true
                            : 'Enter a valid phone number';
                        },
                      })}
                    />
                    <label
                      htmlFor='phone'
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-600 peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600 bg-transparent px-1'
                    >
                      Phone
                    </label>
                  </div>
                  {errors.phone?.message && (
                    <p className='text-xs -mt-3 text-red-500'>
                      {String(errors.phone.message)}
                    </p>
                  )}
                </>
              )}

              <div className='relative'>
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  placeholder=' '
                  className='peer mb-4 sm:mb-5 h-12 sm:h-14 pt-4 sm:pt-5'
                  {...rhfRegister('email', {
                    required: 'Email is required',
                    pattern: {
                      value:
                        /^(?:[a-zA-Z0-9_'^&+{}-]+(?:\.[a-zA-Z0-9_'^&+{}-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
                      message: 'Enter a valid email',
                    },
                  })}
                />
                <label
                  htmlFor='email'
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-600 peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600 bg-transparent px-1'
                >
                  Email
                </label>
              </div>
              {errors.email?.message && (
                <p className='text-xs -mt-3 text-red-500'>
                  {String(errors.email.message)}
                </p>
              )}

              <div className='relative'>
                <Input
                  id='password'
                  placeholder=' '
                  type='password'
                  autoComplete='current-password'
                  className='peer h-12 sm:h-14 pt-4 sm:pt-5'
                  {...rhfRegister('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <label
                  htmlFor='password'
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-600 peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600 bg-transparent px-1'
                >
                  Password
                </label>
              </div>
              {errors.password?.message && (
                <p className='text-xs -mt-3 text-red-500'>
                  {String(errors.password.message)}
                </p>
              )}

              {tab === 'up' && (
                <>
                  <div className='relative'>
                    <Input
                      id='confirmPassword'
                      placeholder=' '
                      type='password'
                      autoComplete='new-password'
                      className='peer h-12 sm:h-14 pt-4 sm:pt-5'
                      {...rhfRegister('confirmPassword', {
                        validate: (v) => {
                          if (tab !== 'up') return true;
                          if (!v) return 'Confirm your password';
                          return v === pwd ? true : 'Passwords do not match';
                        },
                      })}
                    />
                    <label
                      htmlFor='confirmPassword'
                      className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-gray-600 peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-gray-600 bg-transparent px-1'
                    >
                      Confirm Password
                    </label>
                  </div>
                  {errors.confirmPassword?.message && (
                    <p className='text-xs -mt-3 text-red-500'>
                      {String(errors.confirmPassword.message)}
                    </p>
                  )}
                </>
              )}

              {tab === 'in' && (
                <label className='flex items-center gap-3 select-none text-sm text-gray-950'>
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border border-gray-300 accent-[#D22B21]'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember Me
                </label>
              )}

              {tab === 'in' && loginLoading && (
                <div className='space-y-2' aria-live='polite' aria-busy='true'>
                  <div className='h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse' />
                  <div className='h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse' />
                </div>
              )}
              <Button
                className='cursor-pointer rounded-full w-full'
                disabled={tab === 'in' && loginLoading}
              >
                {tab === 'in'
                  ? loginLoading
                    ? 'Signing in…'
                    : 'Login'
                  : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Toaster position='top-right' richColors />
    </div>
  );
}
