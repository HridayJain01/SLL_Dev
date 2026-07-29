import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { IChildProfile, IMembership, ISavedAddress, IUser } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { isMembershipActive } from '@/lib/plans';
import { formatDate } from '@/lib/orders';
import {
  AccountPage,
  AccountPageHeader,
  Card,
  CardTitle,
} from '@/components/account/AccountCard';

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

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="font-body text-[11px] font-semibold uppercase leading-[16.5px] tracking-[1.1px] text-slate-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className="h-[46px] rounded-[14px] border border-[#e5e7eb] bg-white px-[17px] font-body text-[14px] leading-[20px] text-[#374151] outline-none transition-colors focus:border-lagoon-deep"
      />
    </label>
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

function FormActions({
  onCancel,
  submitLabel,
  pending,
}: {
  onCancel: () => void;
  submitLabel: string;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-[12px] pt-[4px]">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-lagoon-deep px-[21px] py-[10px] font-body text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-lagoon-darkest disabled:cursor-not-allowed disabled:bg-[#d1d5db]"
      >
        {pending ? 'Saving…' : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="font-body text-[14px] font-medium leading-[20px] text-slate-muted hover:text-night"
      >
        Cancel
      </button>
    </div>
  );
}

type ChildDraft = { name: string; ageMin: string; ageMax: string };
type AddressDraft = { label: string; line: string; isDefault: boolean };

const EMPTY_CHILD: ChildDraft = { name: '', ageMin: '', ageMax: '' };
const EMPTY_ADDRESS: AddressDraft = { label: '', line: '', isDefault: false };

/**
 * "My Account" — Figma node 380:230, backed by `/users/me`: account details,
 * children's profiles, saved addresses and the account pause switch.
 */
export default function AccountProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const storedUser = useAuthStore((s) => s.user);

  const { data: user } = useQuery({
    queryKey: ['account', 'me'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data.user as IUser;
    },
    enabled: !!storedUser,
    initialData: storedUser ?? undefined,
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership | null;
    },
    enabled: !!storedUser,
  });

  // Keeps the navbar / sidebar in step with edits made here.
  const applyUser = (updated: IUser) => {
    queryClient.setQueryData(['account', 'me'], updated);
    setUser(updated);
  };

  const failed = (fallback: string) => (err: any) =>
    toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || fallback);

  /* ---------------- account details ---------------- */

  const [editingDetails, setEditingDetails] = useState(false);
  const [details, setDetails] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (user) setDetails({ name: user.name ?? '', phone: user.phone ?? '' });
  }, [user?.name, user?.phone]);

  const saveDetails = useMutation({
    mutationFn: async () => {
      const res = await api.put('/users/me', { name: details.name.trim(), phone: details.phone.trim() });
      return res.data.user as IUser;
    },
    onSuccess: (updated) => {
      applyUser(updated);
      setEditingDetails(false);
      toast.success('Account details updated');
    },
    onError: failed('Could not update your details'),
  });

  /* ---------------- password ---------------- */

  const [editingPassword, setEditingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  const changePassword = useMutation({
    mutationFn: async () => {
      await api.post('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
    },
    onSuccess: () => {
      setPasswords({ current: '', next: '', confirm: '' });
      setEditingPassword(false);
      toast.success('Password changed');
    },
    onError: failed('Could not change your password'),
  });

  /* ---------------- children ---------------- */

  const [childDraft, setChildDraft] = useState<ChildDraft>(EMPTY_CHILD);
  const [childFormOpen, setChildFormOpen] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);

  const closeChildForm = () => {
    setChildFormOpen(false);
    setEditingChildId(null);
    setChildDraft(EMPTY_CHILD);
  };

  const saveChild = useMutation({
    mutationFn: async () => {
      const payload = {
        name: childDraft.name.trim(),
        ageMin: Number(childDraft.ageMin),
        ageMax: Number(childDraft.ageMax),
      };
      const res = editingChildId
        ? await api.put(`/users/me/children/${editingChildId}`, payload)
        : await api.post('/users/me/children', payload);
      return res.data.user as IUser;
    },
    onSuccess: (updated) => {
      applyUser(updated);
      closeChildForm();
      toast.success("Child's profile saved");
    },
    onError: failed("Could not save the child's profile"),
  });

  const deleteChild = useMutation({
    mutationFn: async (childId: string) => {
      const res = await api.delete(`/users/me/children/${childId}`);
      return res.data.user as IUser;
    },
    onSuccess: (updated) => {
      applyUser(updated);
      toast.success("Child's profile removed");
    },
    onError: failed('Could not remove the profile'),
  });

  const submitChild = (event: React.FormEvent) => {
    event.preventDefault();
    const ageMin = Number(childDraft.ageMin);
    const ageMax = Number(childDraft.ageMax);
    if (!childDraft.name.trim()) return toast.error('Add the child’s name');
    if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax)) return toast.error('Add an age range');
    if (ageMax < ageMin) return toast.error('The maximum age must be the same as or above the minimum');
    saveChild.mutate();
  };

  /* ---------------- addresses ---------------- */

  const [addressDraft, setAddressDraft] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const closeAddressForm = () => {
    setAddressFormOpen(false);
    setEditingAddressId(null);
    setAddressDraft(EMPTY_ADDRESS);
  };

  const saveAddress = useMutation({
    mutationFn: async (override?: { id: string; body: AddressDraft }) => {
      const payload = override?.body ?? addressDraft;
      const body = {
        label: payload.label.trim(),
        line: payload.line.trim(),
        isDefault: payload.isDefault,
      };
      const id = override?.id ?? editingAddressId;
      const res = id
        ? await api.put(`/users/me/addresses/${id}`, body)
        : await api.post('/users/me/addresses', body);
      return res.data.user as IUser;
    },
    onSuccess: (updated) => {
      applyUser(updated);
      closeAddressForm();
      toast.success('Address saved');
    },
    onError: failed('Could not save the address'),
  });

  const deleteAddress = useMutation({
    mutationFn: async (addressId: string) => {
      const res = await api.delete(`/users/me/addresses/${addressId}`);
      return res.data.user as IUser;
    },
    onSuccess: (updated) => {
      applyUser(updated);
      toast.success('Address removed');
    },
    onError: failed('Could not remove the address'),
  });

  const submitAddress = (event: React.FormEvent) => {
    event.preventDefault();
    if (!addressDraft.label.trim()) return toast.error('Give the address a label');
    if (!addressDraft.line.trim()) return toast.error('Add the full address');
    saveAddress.mutate(undefined);
  };

  const startEditingAddress = (address: ISavedAddress) => {
    setEditingAddressId(address._id);
    setAddressDraft({ label: address.label, line: address.line, isDefault: address.isDefault });
    setAddressFormOpen(true);
  };

  /* ---------------- account pause ---------------- */

  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const toggleAccount = useMutation({
    mutationFn: async (action: 'deactivate' | 'reactivate') => {
      const res = await api.post(`/users/me/${action}`);
      return res.data.user as IUser;
    },
    onSuccess: (updated) => {
      applyUser(updated);
      queryClient.invalidateQueries({ queryKey: ['membership', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setConfirmDeactivate(false);
      toast.success(updated.deactivatedAt ? 'Your account is paused' : 'Welcome back — your account is active');
    },
    onError: failed('Could not update your account'),
  });

  /* ---------------- render ---------------- */

  const children: IChildProfile[] = user?.children ?? [];
  const addresses: ISavedAddress[] = user?.addresses ?? [];
  const isPaused = Boolean(user?.deactivatedAt);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;
  const activeMember = isMembershipActive(membership);

  return (
    <AccountPage>
      <AccountPageHeader
        title="My Account"
        subtitle="Manage your account, children's details, and delivery preferences."
      />

      {/* Member strip */}
      <div className="flex items-center gap-[20px] py-[2px]">
        <span className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-full bg-[#cce8e4] font-heading text-[22px] font-bold text-lagoon-darkest">
          {(user?.name?.trim()?.[0] ?? 'S').toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-[12px]">
            <span className="font-heading text-[18px] font-bold leading-[28px] text-night">
              {user?.name ?? 'Your account'}
            </span>
            {activeMember && (
              <span className="rounded-full bg-lagoon-deep px-[12px] py-[4px] font-body text-[12px] font-semibold leading-[16px] text-white">
                Active member
              </span>
            )}
            {isPaused && (
              <span className="rounded-full bg-[#fef3c7] px-[12px] py-[4px] font-body text-[12px] font-semibold leading-[16px] text-[#92400e]">
                Account paused
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
            {!editingDetails && (
              <button
                type="button"
                onClick={() => setEditingDetails(true)}
                className="font-body text-[14px] font-semibold leading-[20px] text-lagoon-deep hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {editingDetails ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!details.name.trim()) return toast.error('Your name cannot be empty');
                saveDetails.mutate();
              }}
              className="pt-[24px]"
            >
              <div className="grid gap-x-[20px] gap-y-[22px] sm:grid-cols-2">
                <TextField
                  label="Full Name"
                  value={details.name}
                  onChange={(value) => setDetails((d) => ({ ...d, name: value }))}
                  autoFocus
                />
                <TextField
                  label="Phone Number"
                  value={details.phone}
                  onChange={(value) => setDetails((d) => ({ ...d, phone: value }))}
                  placeholder="e.g. 98765 43210"
                />
                <ReadOnlyField label="Email Address" value={user?.email ?? '—'} />
              </div>
              <FormActions
                onCancel={() => {
                  setEditingDetails(false);
                  setDetails({ name: user?.name ?? '', phone: user?.phone ?? '' });
                }}
                submitLabel="Save changes"
                pending={saveDetails.isPending}
              />
            </form>
          ) : (
            <div className="grid gap-x-[20px] gap-y-[22px] pt-[24px] sm:grid-cols-2">
              <ReadOnlyField label="Full Name" value={user?.name ?? '—'} />
              <ReadOnlyField label="Email Address" value={user?.email ?? '—'} />
              <ReadOnlyField label="Phone Number" value={user?.phone || 'Not added yet'} />
              <div className="flex flex-col gap-[6px]">
                <span className="font-body text-[11px] font-semibold uppercase leading-[16.5px] tracking-[1.1px] text-slate-muted">
                  Password
                </span>
                <div className="flex h-[46px] items-center justify-between rounded-[14px] border border-[#e5e7eb] bg-white px-[17px]">
                  <span className="font-body text-[14px] leading-[20px] text-[#374151]">
                    ••••••••••
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingPassword((open) => !open)}
                    className="font-body text-[13px] font-semibold leading-[20px] text-lagoon-deep hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {editingPassword && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (passwords.next.length < 6)
                  return toast.error('The new password must be at least 6 characters');
                if (passwords.next !== passwords.confirm)
                  return toast.error('The new passwords do not match');
                changePassword.mutate();
              }}
              className="mt-[22px] border-t border-[#f3f4f6] pt-[22px]"
            >
              <div className="grid gap-x-[20px] gap-y-[22px] sm:grid-cols-3">
                <TextField
                  label="Current password"
                  type="password"
                  value={passwords.current}
                  onChange={(value) => setPasswords((p) => ({ ...p, current: value }))}
                />
                <TextField
                  label="New password"
                  type="password"
                  value={passwords.next}
                  onChange={(value) => setPasswords((p) => ({ ...p, next: value }))}
                />
                <TextField
                  label="Confirm new password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(value) => setPasswords((p) => ({ ...p, confirm: value }))}
                />
              </div>
              <FormActions
                onCancel={() => {
                  setEditingPassword(false);
                  setPasswords({ current: '', next: '', confirm: '' });
                }}
                submitLabel="Update password"
                pending={changePassword.isPending}
              />
            </form>
          )}
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
              key={child._id}
              className="flex flex-wrap items-center gap-[16px] border-b border-[#f3f4f6] pb-[17px] pt-[16px]"
            >
              <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full bg-[#fef3c7] font-heading text-[16px] font-bold text-[#92400e]">
                {child.name.trim()[0]?.toUpperCase() ?? '?'}
              </span>
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
              <div className="flex shrink-0 items-center gap-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingChildId(child._id);
                    setChildDraft({
                      name: child.name,
                      ageMin: String(child.ageMin),
                      ageMax: String(child.ageMax),
                    });
                    setChildFormOpen(true);
                  }}
                  className="font-body text-[14px] font-medium leading-[20px] text-lagoon-deep hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteChild.mutate(child._id)}
                  disabled={deleteChild.isPending}
                  className="font-body text-[14px] font-medium leading-[20px] text-[#ef4444] hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {children.length === 0 && !childFormOpen && (
            <p className="py-[16px] font-body text-[14px] leading-[20px] text-slate-muted">
              Add your children so we can match books to their reading age.
            </p>
          )}

          <div className="pt-[12px]">
            {childFormOpen ? (
              <form onSubmit={submitChild} className="rounded-[16px] bg-[#f9fafb] p-[18px]">
                <div className="grid gap-x-[20px] gap-y-[18px] sm:grid-cols-3">
                  <TextField
                    label="Name"
                    value={childDraft.name}
                    onChange={(value) => setChildDraft((d) => ({ ...d, name: value }))}
                    autoFocus
                  />
                  <TextField
                    label="Youngest age"
                    type="number"
                    value={childDraft.ageMin}
                    onChange={(value) => setChildDraft((d) => ({ ...d, ageMin: value }))}
                    placeholder="3"
                  />
                  <TextField
                    label="Oldest age"
                    type="number"
                    value={childDraft.ageMax}
                    onChange={(value) => setChildDraft((d) => ({ ...d, ageMax: value }))}
                    placeholder="5"
                  />
                </div>
                <FormActions
                  onCancel={closeChildForm}
                  submitLabel={editingChildId ? 'Save profile' : "Add child's profile"}
                  pending={saveChild.isPending}
                />
              </form>
            ) : (
              <AddButton
                onClick={() => {
                  setEditingChildId(null);
                  setChildDraft(EMPTY_CHILD);
                  setChildFormOpen(true);
                }}
              >
                + Add another child's profile
              </AddButton>
            )}
          </div>
        </Card>

        {/* Saved addresses */}
        <Card>
          <CardTitle>Saved Addresses</CardTitle>

          <div className="space-y-[12px] pt-[20px]">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`rounded-[16px] px-[21px] py-[17px] ${
                  address.isDefault
                    ? 'border border-[#a7d9d2] bg-[#f0faf8]'
                    : 'border border-[#e5e7eb] bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          saveAddress.mutate({
                            id: address._id,
                            body: { label: address.label, line: address.line, isDefault: true },
                          })
                        }
                        disabled={saveAddress.isPending}
                        className="font-body text-[14px] font-medium leading-[20px] text-slate-muted hover:text-night disabled:opacity-50"
                      >
                        Make default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => startEditingAddress(address)}
                      className="font-body text-[14px] font-medium leading-[20px] text-lagoon-deep hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteAddress.mutate(address._id)}
                      disabled={deleteAddress.isPending}
                      className="font-body text-[14px] font-medium leading-[20px] text-[#ef4444] hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="pt-[6px] font-body text-[14px] leading-[20px] text-[#6b7280]">
                  {address.line}
                </p>
              </div>
            ))}

            {addresses.length === 0 && !addressFormOpen && (
              <p className="font-body text-[14px] leading-[20px] text-slate-muted">
                Add a delivery address so your box knows where to go.
              </p>
            )}
          </div>

          <div className="pt-[12px]">
            {addressFormOpen ? (
              <form onSubmit={submitAddress} className="rounded-[16px] bg-[#f9fafb] p-[18px]">
                <div className="grid gap-x-[20px] gap-y-[18px] sm:grid-cols-2">
                  <TextField
                    label="Label"
                    value={addressDraft.label}
                    onChange={(value) => setAddressDraft((d) => ({ ...d, label: value }))}
                    placeholder="Home"
                    autoFocus
                  />
                  <TextField
                    label="Full address"
                    value={addressDraft.line}
                    onChange={(value) => setAddressDraft((d) => ({ ...d, line: value }))}
                    placeholder="Flat, street, area, city, PIN"
                  />
                </div>
                <label className="flex items-center gap-[8px] pt-[14px] font-body text-[13px] leading-[20px] text-[#374151]">
                  <input
                    type="checkbox"
                    checked={addressDraft.isDefault}
                    onChange={(event) =>
                      setAddressDraft((d) => ({ ...d, isDefault: event.target.checked }))
                    }
                    className="h-[16px] w-[16px] accent-lagoon-deep"
                  />
                  Deliver here by default
                </label>
                <FormActions
                  onCancel={closeAddressForm}
                  submitLabel={editingAddressId ? 'Save address' : 'Add address'}
                  pending={saveAddress.isPending}
                />
              </form>
            ) : (
              <AddButton
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressDraft(EMPTY_ADDRESS);
                  setAddressFormOpen(true);
                }}
              >
                + Add a new address
              </AddButton>
            )}
          </div>
        </Card>

        {/* Pause / resume */}
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[420px]">
            <CardTitle>{isPaused ? 'Reactivate account' : 'Deactivate account'}</CardTitle>
            <p className="pt-[4px] font-body text-[14px] leading-[20px] text-slate-muted">
              {isPaused ? (
                <>
                  Your account is paused and deliveries are on hold.
                  {membership && ` Your plan runs until ${formatDate(membership.endDate)}.`}
                </>
              ) : (
                <>
                  This will pause your membership and deliveries.
                  <br />
                  You can reactivate anytime.
                </>
              )}
            </p>
            {!isPaused && confirmDeactivate && (
              <p className="pt-[8px] font-body text-[13px] font-semibold leading-[20px] text-[#b91c1c]">
                Any books already with you still need to be returned. Confirm to pause?
              </p>
            )}
          </div>

          {isPaused ? (
            <button
              type="button"
              onClick={() => toggleAccount.mutate('reactivate')}
              disabled={toggleAccount.isPending}
              className="shrink-0 self-start rounded-full bg-lagoon-deep px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-lagoon-darkest disabled:cursor-not-allowed disabled:bg-[#d1d5db] sm:self-auto"
            >
              {toggleAccount.isPending ? 'Working…' : 'Reactivate Account'}
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-[12px] self-start sm:self-auto">
              {confirmDeactivate && (
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(false)}
                  className="font-body text-[14px] font-medium leading-[20px] text-slate-muted hover:text-night"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  confirmDeactivate ? toggleAccount.mutate('deactivate') : setConfirmDeactivate(true)
                }
                disabled={toggleAccount.isPending}
                className="rounded-full border border-[#ef4444] px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] text-[#ef4444] transition-colors hover:bg-[#ef4444]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {toggleAccount.isPending
                  ? 'Working…'
                  : confirmDeactivate
                    ? 'Yes, pause my account'
                    : 'Deactivate Account'}
              </button>
            </div>
          )}
        </Card>

        {!activeMember && (
          <p className="font-body text-[14px] leading-[20px] text-slate-muted">
            Looking for your plan?{' '}
            <Link to="/account/membership" className="font-semibold text-lagoon-deep hover:underline">
              See membership options
            </Link>
            .
          </p>
        )}
      </div>
    </AccountPage>
  );
}
