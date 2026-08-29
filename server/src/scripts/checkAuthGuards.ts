import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Self-check for the one auth path that has no password to compare against.
 *
 * A Google-only account stores no hash, and `bcrypt.compare(x, undefined)`
 * rejects — which would surface as a 500 on the login route the first time such
 * a member typed their email into the password form. Needs no database: a
 * Mongoose document can be built offline.
 *
 * Run with:  npx tsx src/scripts/checkAuthGuards.ts
 */
async function main() {
  const googleOnly = new User({ name: 'Google User', email: 'g@example.com', googleId: 'sub-123' });
  assert.equal(googleOnly.password, undefined, 'a Google account stores no password');
  assert.equal(
    await googleOnly.comparePassword('anything'),
    false,
    'comparePassword must return false, not throw, when there is no hash'
  );

  const withPassword = new User({ name: 'Pw User', email: 'p@example.com' });
  withPassword.password = await bcrypt.hash('correct-horse', 12);
  assert.equal(await withPassword.comparePassword('correct-horse'), true, 'right password matches');
  assert.equal(await withPassword.comparePassword('wrong'), false, 'wrong password rejected');

  // The model must still refuse an account with neither credential path.
  const noEmail = new User({ name: 'Nobody' });
  assert.ok(noEmail.validateSync()?.errors.email, 'email is still required');

  console.log('auth guard checks passed');
}

main().catch((err) => { console.error(err); process.exit(1); });
