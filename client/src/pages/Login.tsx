import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import AuthLayout from '@/components/auth/AuthLayout';
import { AuthField, AuthHeading, AuthSubmit } from '@/components/auth/AuthField';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

/** Matches the accounts created by `npm run seed:users`. Dev builds only. */
const DEV_ACCOUNTS: { label: string; email: string; password: string }[] = [
  { label: 'Admin', email: 'admin@dev.local', password: 'admin123' },
  { label: 'User', email: 'user@dev.local', password: 'user123' },
];

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useReactHookForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', data);
      setUser(res.data.user);
      setToken(res.data.token || null);
      toast.success('Logged in successfully');
      navigate(res.data.user?.role === 'ADMIN' ? '/admin' : '/account');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  /** Fills the form so the values stay visible, then runs the normal login path. */
  const quickLogin = (account: (typeof DEV_ACCOUNTS)[number]) => {
    setValue('email', account.email);
    setValue('password', account.password);
    onSubmit({ email: account.email, password: account.password });
  };

  return (
    <AuthLayout headline="Good to have you back with us" headlineWidth={582}>
      <AuthHeading title="Welcome Back!" subtitle="Log in to browse the library" />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-[22.45px] flex flex-col">
        {/* Fields are 404px inside the 442px column; the button spans the full width. */}
        <div className="flex flex-col gap-[19.7px] px-[19px]">
          <AuthField
            label="Email address"
            type="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register('email')}
          />
          <AuthField
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <div className="mt-[34px]">
          <AuthSubmit disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</AuthSubmit>
        </div>
      </form>

      <p className="mt-[28px] text-center font-body text-[14px] font-medium leading-[23px] text-black">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="text-[#0F3DDE]">
          Sign Up
        </Link>
      </p>

      {import.meta.env.DEV && (
        <div className="mt-[20px] flex flex-col items-center gap-[8px] rounded-[10px] border border-dashed border-black/25 px-[19px] py-[12px]">
          <span className="font-body text-[10px] font-medium uppercase tracking-[0.08em] text-[#6b6f85]">
            Dev quick login
          </span>
          <div className="flex gap-[8px]">
            {DEV_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading}
                onClick={() => quickLogin(account)}
                className="h-[30px] rounded-full border border-black bg-white px-[16px] font-body text-[12px] font-medium text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
