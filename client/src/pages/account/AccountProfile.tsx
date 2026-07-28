import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { IMembership } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  SAMPLE_ADDRESSES,
  SAMPLE_CHILD_PROFILES,
  type ChildProfile,
  type SavedAddress,
} from '@/lib/accountPlaceholders';

/** Card shell — Figma node 380:254. */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[24px] bg-white p-[28px] drop-shadow-[0px_2px_6px_rgba(0,0,0,0.06)] ${className}`}
    >
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-heading text-[16px] font-extrabold leading-[24px] text-night">{children}</h2>
  );
}

/** Read-only field — Figma node 380:262. */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <span className="font-body text-[11px] font-semibold uppercase leading-[16.5px] tracking-[1.1px] text-slate-muted">
        {label}
      </span>
      <div className="flex h-[46px] items-center rounded-[14px] border border-[#e5e7eb] bg-white px-[17px]">
        <span className="truncate font-body text-[14px] leading-[20px] text-[#374151]">{value}</span>
      </div>
    </div>
  );
}

/** Dashed add button — Figma nodes 380:308 and 380:339. */
function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[52px] w-full rounded-[16px] border-2 border-dashed border-[#d1d5db] font-body text-[14px] font-medium leading-[20px] text-[#9ca3af] transition-colors hover:border-lagoon-deep hover:text-lagoon-deep"
    >
      {children}
    </button>
  );
}

/**
 * "My Account" — Figma node 380:230.
 * Account details come from the signed-in user; children's profiles and saved
 * addresses are local-only until the API supports them (see accountPlaceholders).
 */
export default function AccountProfile() {
  const user = useAuthStore((s) => s.user);
  const [children] = useState<ChildProfile[]>(SAMPLE_CHILD_PROFILES);
  const [addresses, setAddresses] = useState<SavedAddress[]>(SAMPLE_ADDRESSES);

  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership | null;
    },
  });

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;
  const isActiveMember = membership?.status === 'ACTIVE';

  const notWiredYet = () =>
    toast.info('Editing is coming soon — this screen is not connected to the API yet.');

  return (
    <div className="bg-white px-4 pb-[80px] pt-[64px] sm:px-[40px]">
      <div className="max-w-[987px]">
        {/* Page header */}
        <header>
          <h1 className="font-heading text-[36px] font-extrabold leading-[40px] text-night">
            My Account
          </h1>
          <p className="pt-[4px] font-body text-[16px] leading-[20px] text-slate-muted">
            Manage your account, children's details, and delivery preferences.
          </p>
        </header>

        {/* Member strip */}
        <div className="flex items-center gap-[20px] py-[26px]">
          <span className="h-[64px] w-[64px] shrink-0 rounded-full bg-[#cce8e4]" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[12px]">
              <span className="font-heading text-[18px] font-bold leading-[28px] text-night">
                {user?.name ?? 'Your account'}
              </span>
              {isActiveMember && (
                <span className="rounded-full bg-lagoon-deep px-[12px] py-[4px] font-body text-[12px] font-semibold leading-[16px] text-white">
                  Active member
                </span>
              )}
            </div>
            <p className="truncate pt-[4px] font-body text-[15px] leading-[20px] text-[#9ca3af]">
              {user?.email}
              {memberSince && ` · Member since ${memberSince}`}
            </p>
          </div>
        </div>

        <div className="space-y-[20px]">
          {/* Account details */}
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>Account Details</CardTitle>
              <button
                type="button"
                onClick={notWiredYet}
                className="font-body text-[14px] font-semibold leading-[20px] text-lagoon-deep hover:underline"
              >
                Edit
              </button>
            </div>
            <div className="grid gap-x-[20px] gap-y-[22px] pt-[24px] sm:grid-cols-2">
              <ReadOnlyField label="Full Name" value={user?.name ?? '—'} />
              <ReadOnlyField label="Email Address" value={user?.email ?? '—'} />
              <ReadOnlyField label="Phone Number" value={user?.phone ?? '—'} />
              <ReadOnlyField label="Password" value={'••••••••••'} />
            </div>
          </Card>

          {/* Children's profiles */}
          <Card>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Children's Profiles</CardTitle>
              <span className="font-body text-[11px] font-semibold uppercase leading-[16.5px] tracking-[1.1px] text-lagoon-deep">
                Used for Recommendations
              </span>
            </div>

            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-[16px] border-b border-[#f3f4f6] pb-[17px] pt-[16px]"
              >
                <span className="h-[44px] w-[44px] shrink-0 rounded-full bg-[#fef3c7]" />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[14px] font-semibold leading-[20px] text-night">
                    {child.name}
                  </p>
                  <p className="pt-[2px] font-body text-[12px] leading-[16px] text-slate-muted">
                    Reading age group: {child.ageMin}–{child.ageMax} years
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-lagoon-deep px-[13px] py-[5px] font-body text-[12px] font-medium leading-[16px] text-lagoon-deep">
                  Ages {child.ageMin}–{child.ageMax}
                </span>
              </div>
            ))}

            <div className="pt-[12px]">
              <AddButton onClick={notWiredYet}>+ Add another child's profile</AddButton>
            </div>
          </Card>

          {/* Saved addresses */}
          <Card>
            <CardTitle>Saved Addresses</CardTitle>

            <div className="space-y-[12px] pt-[20px]">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`rounded-[16px] px-[21px] py-[17px] ${
                    address.isDefault
                      ? 'border border-[#a7d9d2] bg-[#f0faf8]'
                      : 'border border-[#e5e7eb] bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-[8px]">
                      <span className="font-body text-[14px] font-semibold leading-[20px] text-night">
                        {address.label}
                      </span>
                      {address.isDefault && (
                        <span className="rounded-full border border-lagoon-deep px-[9px] py-[3px] font-body text-[11px] font-medium leading-[16.5px] text-lagoon-deep">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-[12px]">
                      <button
                        type="button"
                        onClick={notWiredYet}
                        className="font-body text-[14px] font-medium leading-[20px] text-lagoon-deep hover:underline"
                      >
                        Edit
                      </button>
                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() =>
                            setAddresses((list) => list.filter((a) => a.id !== address.id))
                          }
                          className="font-body text-[14px] font-medium leading-[20px] text-[#ef4444] hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="pt-[6px] font-body text-[14px] leading-[20px] text-[#6b7280]">
                    {address.line}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-[12px]">
              <AddButton onClick={notWiredYet}>+ Add a new address</AddButton>
            </div>
          </Card>

          {/* Deactivate */}
          <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-[384px]">
              <CardTitle>Deactivate account</CardTitle>
              <p className="pt-[4px] font-body text-[14px] leading-[20px] text-slate-muted">
                This will pause your membership and deliveries.
                <br />
                You can reactivate anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={notWiredYet}
              className="shrink-0 self-start rounded-full border border-[#ef4444] px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] text-[#ef4444] transition-colors hover:bg-[#ef4444]/5 sm:self-auto"
            >
              Deactivate Account
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
