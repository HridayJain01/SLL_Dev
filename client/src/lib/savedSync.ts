import api from '@/lib/axios';
import { IBook } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useWishlistStore } from '@/store/wishlistStore';

/**
 * Keeps the box and wishlist stores tied to whoever is signed in.
 *
 * The stores still persist locally so a guest can pick books before logging in,
 * but the account (`/users/me/saved`) is the source of truth once they do:
 *
 *  - sign in  → the account's lists load, and anything picked as a guest joins them
 *  - change   → the whole list is written back (debounced)
 *  - sign out → both stores are wiped, so the next person on this browser
 *               never sees the last one's picks
 *
 * Imported once from main.tsx for its side effects.
 */

/** Whose lists are loaded. Writes wait until this matches the signed-in user. */
let loadedFor: string | null = null;
/** Set while this module writes to the stores itself, so that doesn't echo back to the server. */
let applying = false;

function apply(fn: () => void) {
  applying = true;
  try {
    fn();
  } finally {
    applying = false;
  }
}

function debounced(fn: () => void, ms = 400) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

const push = (body: { wishlist?: string[]; box?: string[] }) =>
  api.put('/users/me/saved', body).catch(() => {
    // Best-effort: the local copy is intact and the next change sends the full list again.
  });

const pushWishlist = debounced(() => push({ wishlist: useWishlistStore.getState().wishlist }));
const pushBox = debounced(() =>
  push({ box: useBookBasketStore.getState().selectedBooks.map((book) => book._id) })
);

async function load(userId: string) {
  loadedFor = null;
  try {
    const { data } = await api.get<{ wishlist: string[]; box: IBook[] }>('/users/me/saved');
    if (useAuthStore.getState().user?._id !== userId) return;

    const guestWishlist = useWishlistStore.getState().wishlist;
    const guestBox = useBookBasketStore.getState().selectedBooks;
    const wishlist = [...new Set([...data.wishlist, ...guestWishlist])];
    const box = [...data.box, ...guestBox.filter((book) => !data.box.some((saved) => saved._id === book._id))];

    apply(() => {
      useWishlistStore.setState({ wishlist });
      useBookBasketStore.setState({ selectedBooks: box });
    });
    loadedFor = userId;

    if (wishlist.length !== data.wishlist.length) pushWishlist();
    if (box.length !== data.box.length) pushBox();
  } catch {
    // Leave the local lists alone; writes stay paused until the next sign-in or reload.
  }
}

function clear() {
  loadedFor = null;
  apply(() => {
    useWishlistStore.setState({ wishlist: [] });
    useBookBasketStore.setState({ selectedBooks: [] });
  });
}

useAuthStore.subscribe((state, prev) => {
  const id = state.user?._id ?? null;
  if (id === (prev.user?._id ?? null)) return;
  if (id) void load(id);
  else clear();
});

useWishlistStore.subscribe((state, prev) => {
  if (applying || state.wishlist === prev.wishlist) return;
  if (loadedFor && loadedFor === useAuthStore.getState().user?._id) pushWishlist();
});

useBookBasketStore.subscribe((state, prev) => {
  if (applying || state.selectedBooks === prev.selectedBooks) return;
  if (loadedFor && loadedFor === useAuthStore.getState().user?._id) pushBox();
});

const current = useAuthStore.getState().user?._id;
if (current) void load(current);
