import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { useCartStore } from '@/store/cartStore';
import { IBook, IMembership } from '@/types';
import { toast } from 'sonner';
import { BookOpen, Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react';

export default function Preferences() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const selectedBooks = useBookBasketStore((s) => s.selectedBooks);
  const removeBook = useBookBasketStore((s) => s.removeBook);
  const addBook = useBookBasketStore((s) => s.addBook);
  const clearBooks = useBookBasketStore((s) => s.clearBooks);
  const cartBooks = useCartStore((s) => s.cartBooks);
  const addToCart = useCartStore((s) => s.addToCart);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership;
    },
    enabled: !!user,
  });

  const { data: borrows } = useQuery({
    queryKey: ['borrows', 'active'],
    queryFn: async () => {
      const res = await api.get('/borrows', { params: { status: 'ACTIVE' } });
      return res.data.borrows as { _id: string }[];
    },
    enabled: !!user,
  });

  const placeOrder = useMutation({
    mutationFn: async () => {
      await api.post('/borrows/request', {
        bookIds: cartBooks.map((book) => book._id),
      });
    },
    onSuccess: () => {
      cartBooks.forEach((book) => removeBook(book._id));
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Your order has been placed');
    },
    onError: (err: any) => {
      const missingBookIds = err.response?.data?.missingBookIds as string[] | undefined;
      if (Array.isArray(missingBookIds) && missingBookIds.length > 0) {
        missingBookIds.forEach((bookId) => {
          removeBook(bookId);
          removeFromCart(bookId);
        });
        toast.error('Some books were removed because they are no longer available. Please review your basket and try again.');
        return;
      }

      toast.error(err.response?.data?.message || 'Could not place order');
    },
  });

  const selectedCount = selectedBooks.length;
  const cartCount = cartBooks.length;
  const booksPerCycle = membership?.booksPerCycle || 0;
  const usedQuota = borrows?.length || 0;
  const quotaRemaining = membership ? Math.max(0, booksPerCycle - usedQuota) : 0;
  const canCheckout = Boolean(user && membership && cartCount > 0 && cartCount <= quotaRemaining && !placeOrder.isPending);

  const handleAddToCart = (book: IBook) => {
    if (!membership) {
      toast.error('Activate membership before adding books to basket');
      return;
    }

    const alreadyInCart = cartBooks.some((cartBook) => cartBook._id === book._id);
    if (alreadyInCart) {
      toast.success('Already in basket');
      return;
    }

    if (cartBooks.length >= quotaRemaining) {
      toast.error('Basket reached your current quota limit');
      return;
    }

    addToCart(book);
    toast.success('Added to basket');
  };

  const addAllAllowedToCart = () => {
    if (!membership) {
      toast.error('Activate membership before adding books to basket');
      return;
    }

    const alreadyInCartIds = new Set(cartBooks.map((book) => book._id));
    const remainingCapacity = Math.max(0, quotaRemaining - cartBooks.length);
    const candidates = selectedBooks.filter((book) => !alreadyInCartIds.has(book._id)).slice(0, remainingCapacity);

    if (candidates.length === 0) {
      toast.error('No additional books can be added to basket within quota');
      return;
    }

    candidates.forEach((book) => addToCart(book));
    toast.success(`${candidates.length} book(s) added to basket`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Preferences</h1>
          <p className="text-gray-500">Collect books here, then place one order when your list is ready.</p>
        </div>
        <Link to="/library" className="inline-flex items-center gap-2 rounded-xl border border-primary/20 px-4 py-2 text-primary font-medium hover:border-primary">
          <BookOpen className="h-4 w-4" />
          Browse more books
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Books in list</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{selectedCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Books in cart</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{cartCount}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Quota remaining</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{membership ? quotaRemaining : '—'}</p>
        </div>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Log in to place orders and keep your preference list synced with your account.
        </div>
      ) : !membership ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          You do not have an active membership yet. Choose a plan first to enable ordering.
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your order list</h2>
            <p className="text-sm text-gray-500">These books will be borrowed together when you click place order.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedBooks.length > 0 && (
              <button onClick={addAllAllowedToCart} className="text-sm font-medium text-primary hover:text-primary-dark">
                Add Allowed to Basket
              </button>
            )}
            {selectedBooks.length > 0 && (
              <button onClick={() => clearBooks()} className="text-sm font-medium text-gray-500 hover:text-red-600">
                Clear all
              </button>
            )}
          </div>
        </div>

        {selectedBooks.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-4 text-gray-600">Your list is empty. Add books from the library or book details page.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {selectedBooks.map((book: IBook) => {
              const categoryLabel = typeof book.categoryId === 'object' ? book.categoryId.name : 'Book';
              return (
                <div key={book._id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={book.coverImage || `https://placehold.co/300x400?text=${encodeURIComponent(book.title)}`}
                      alt={book.title}
                      className="h-20 w-14 rounded-lg object-cover shadow-sm"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{book.title}</h3>
                      <p className="text-sm text-gray-500">{categoryLabel} · Ages {book.ageGroupMin}-{book.ageGroupMax}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/library/${book._id}`} className="text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                    <button
                      onClick={() => handleAddToCart(book)}
                      className="inline-flex items-center gap-2 rounded-xl border border-primary/20 px-3 py-2 text-sm text-primary hover:border-primary"
                    >
                      Add to Basket
                    </button>
                    <button
                      onClick={() => removeBook(book._id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-red-200 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Cart</h3>
            {cartCount > 0 && (
              <button onClick={() => clearCart()} className="text-sm font-medium text-gray-500 hover:text-red-600">
                Clear cart
              </button>
            )}
          </div>
          {cartCount === 0 ? (
            <p className="text-sm text-gray-500">Your basket is empty. Add books from your preference list.</p>
          ) : (
            <div className="space-y-2">
              {cartBooks.map((book) => (
                <div key={book._id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2">
                  <span className="text-sm font-medium text-gray-800">{book.title}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        addBook(book);
                        removeFromCart(book._id);
                        toast.success('Moved back to preference list');
                      }}
                      className="text-xs font-medium text-gray-500 hover:text-primary"
                    >
                      Move to list
                    </button>
                    <button
                      onClick={() => removeFromCart(book._id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {membership ? `${cartCount} book(s) in basket. ${quotaRemaining} quota slot(s) left this cycle.` : 'Add a membership to unlock checkout.'}
          </div>
          <button
            onClick={() => placeOrder.mutate()}
            disabled={!canCheckout}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <CheckCircle2 className="h-4 w-4" />
            {placeOrder.isPending ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
