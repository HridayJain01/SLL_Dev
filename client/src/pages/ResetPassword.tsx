import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/axios';
import AuthLayout from '@/components/auth/AuthLayout';
import { AuthField, AuthHeading, AuthSubmit } from '@/components/auth/AuthField';

const schema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type ResetForm = z.infer<typeof schema>;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ResetForm) => {
    if (!token) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: data.password });
      // No session is issued here by design — the member signs in as normal.
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'Could not reset your password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Someone opened /reset-password without following a link.
  if (!token) {
    return (
      <AuthLayout headline="That link looks incomplete" headlineWidth={582}>
        <AuthHeading
          title="Link not valid"
          subtitle="This page needs the link from your reset email. Ask for a fresh one and try again."
        />
        <p className="mt-[28px] text-center font-body text-[14px] font-medium leading-[23px] text-black">
          <Link to="/forgot-password" className="text-[#0F3DDE]">
            Send a new link
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout headline="Choose a new password" headlineWidth={582}>
      <AuthHeading title="New password" subtitle="Pick something you'll remember this time" />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-[22.45px] flex flex-col">
        <div className="flex flex-col gap-[19.7px] px-[19px]">
          <AuthField
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <AuthField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.confirm?.message}
            {...register('confirm')}
          />
        </div>

        <div className="mt-[34px]">
          <AuthSubmit disabled={loading}>{loading ? 'Saving...' : 'Update password'}</AuthSubmit>
        </div>
      </form>

      <p className="mt-[28px] text-center font-body text-[14px] font-medium leading-[23px] text-black">
        <Link to="/login" className="text-[#0F3DDE]">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
