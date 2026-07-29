import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';

type PageTransitionProps = {
  /** How far the incoming screen travels, in px. Panes inside a shell move less. */
  distance?: number;
  className?: string;
};

/**
 * Eases the routed screen in instead of swapping it in a single frame.
 *
 * Deliberately enter-only. An exit animation would mean holding the outgoing
 * screen until its animation finished (`AnimatePresence mode="wait"`), which
 * makes rendering the next route depend on frames actually being produced — a
 * backgrounded or throttled tab stops firing rAF and the user is left looking at
 * the previous screen with the new URL in the bar. Remounting straight away and
 * fading the new screen in cannot stall, and it halves the time to first paint.
 *
 * Keyed on `pathname` rather than the whole location so that screens which push
 * their filters into the query string (the library) don't remount on every
 * keystroke.
 */
export default function PageTransition({ distance = 14, className }: PageTransitionProps) {
  const { pathname } = useLocation();
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const offset = reduceMotion ? 0 : distance;

  return (
    <motion.div
      key={pathname}
      className={className}
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.18 : 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      <Outlet />
    </motion.div>
  );
}
