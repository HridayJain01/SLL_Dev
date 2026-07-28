import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import { toast } from 'sonner';
import AuthLayout from '@/components/auth/AuthLayout';
import { AuthField, AuthHeading, AuthSubmit } from '@/components/auth/AuthField';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    phone: z.string().min(10, 'Valid phone number is required'),
    terms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms & policy' }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    try {
      setLoading(true);
      await api.post('/auth/signup', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      toast.success('Account created! Pending admin approval.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout headline="Children's Book Library" headlineWidth={435}>
      <AuthHeading title="Create Account" subtitle="Start your child's reading journey in minutes" />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-[22.45px] flex flex-col">
        {/* Fields are 404px inside the 442px column; the button spans the full width. */}
        <div className="flex flex-col gap-[19.7px] px-[19px]">
          <AuthField
            label="Name"
            type="text"
            placeholder="Enter your name"
            error={errors.name?.message}
            {...register('name')}
          />
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
          <AuthField
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <AuthField
            label="Phone Number"
            type="tel"
            placeholder="+9179563790"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <label className="-mt-[3.7px] flex cursor-pointer items-start gap-[6px]">
            <input
              type="checkbox"
              className="mt-[2.19px] h-[9.85px] w-[9px] shrink-0 appearance-none rounded-[2px] border border-black bg-white checked:bg-primary checked:border-primary"
              {...register('terms')}
            />
            <span className="font-body text-[9px] font-normal leading-[15.32px] text-black">
              I agree to the{' '}
              <Link to="/faq" className="underline">
                terms &amp; policy
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p className="-mt-[13.7px] font-body text-[10px] font-medium text-danger">{errors.terms.message}</p>
          )}
        </div>

        <div className="mt-[18px]">
          <AuthSubmit disabled={loading}>{loading ? 'Creating account...' : 'Sign Up'}</AuthSubmit>
        </div>
      </form>

      <p className="mt-[28px] text-center font-body text-[14px] font-medium leading-[23px] text-black">
        Have an account?{' '}
        <Link to="/login" className="text-[#0F3DDE]">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
