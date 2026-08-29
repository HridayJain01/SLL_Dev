import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import AuthLayout from '@/components/auth/AuthLayout';
import { AuthField, AuthHeading, AuthSubmit } from '@/components/auth/AuthField';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
    } catch {
      // The server answers 200 whether or not the address is known, so the only
      // way here is a network or server fault. Showing the same confirmation
      // either way would be a lie; but revealing which address exists is the
      // thing this endpoint is built to avoid, so we say nothing about the
      // address itself.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <AuthLayout headline="Check your inbox" headlineWidth={582}>
        <AuthHeading
          title="Check your email"
          subtitle={`If ${getValues('email')} is registered, a reset link is on its way. The link works for one hour.`}
        />
        <p className="mt-[28px] text-center font-body text-[14px] font-medium leading-[23px] text-black">
          <Link to="/login" className="text-[#0F3DDE]">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout headline="Let's get you back to your books" headlineWidth={582}>
      <AuthHeading
        title="Forgot password?"
        subtitle="Enter your email and we'll send you a link to choose a new one"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-[22.45px] flex flex-col">
        <div className="flex flex-col gap-[19.7px] px-[19px]">
          <AuthField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="mt-[34px]">
          <AuthSubmit disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</AuthSubmit>
        </div>
      </form>

      <p className="mt-[28px] text-center font-body text-[14px] font-medium leading-[23px] text-black">
        Remembered it?{' '}
        <Link to="/login" className="text-[#0F3DDE]">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
