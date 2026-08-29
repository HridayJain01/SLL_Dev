import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { signToken, setCookieToken } from '../lib/jwt.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * Verifier for Google's ID tokens. Constructed once so the library can cache
 * Google's signing certificates between requests.
 *
 * `GOOGLE_CLIENT_ID` unset simply means the feature is off — the route says so
 * instead of the process failing to boot, because the rest of the app does not
 * depend on it.
 */
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

const googleAuthSchema = z.object({
  /** The `credential` string handed to the callback by Google Identity Services. */
  credential: z.string().min(1),
});

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

/** The session response shape every auth route returns. Never includes the hash. */
function issueSession(res: Response, user: any, statusCode = 200) {
  const token = signToken(String(user._id));
  setCookieToken(res, token);
  const { password, ...userWithoutPassword } = user.toObject();
  return res.status(statusCode).json({ user: userWithoutPassword, token });
}

/** Shared by both login paths so the two cannot drift apart. */
function blockedReason(status: string): string | null {
  if (status === 'PENDING') return 'Account pending admin approval';
  if (status === 'SUSPENDED') return 'Account suspended';
  return null;
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create(data);
    const token = signToken(String(user._id));
    setCookieToken(res, token);

    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    // A Google-only account has no hash to compare against. Say so plainly —
    // "invalid password" would send the member round in circles resetting a
    // password that does not exist.
    if (!user.password) {
      return res.status(401).json({ message: 'This account uses Google sign-in. Use the Google button below.' });
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const blocked = blockedReason(user.status);
    if (blocked) return res.status(403).json({ message: blocked });

    const token = signToken(String(user._id));
    setCookieToken(res, token);

    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

/**
 * Sign in (or sign up) with a Google ID token from Google Identity Services.
 *
 * The token is verified against Google's published keys — signature, issuer,
 * expiry, and audience. `verifyIdToken` does all four, and the audience check is
 * what stops a token minted for some other site being replayed here. Nothing in
 * the request body is trusted: the email and name come out of the verified
 * payload, never off the wire.
 *
 * Three cases, in order:
 *  1. Known `googleId` — returning member, just sign them in.
 *  2. Known email, no `googleId` — an existing password account. Link it, but
 *     only because Google asserts the address is verified; linking on an
 *     unverified address would let anyone who can make a Google profile with
 *     someone else's address walk into that account.
 *  3. Nobody — create the account on the same terms as an email signup.
 */
export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!googleClient) {
      return res.status(503).json({ message: 'Google sign-in is not configured on this server' });
    }

    const { credential } = googleAuthSchema.parse(req.body);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId!,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
    }

    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ message: 'Google did not return an email address' });
    }
    // Google only vouches for addresses it has verified. Without this an
    // attacker could claim any address and be handed the matching account.
    if (!payload.email_verified) {
      return res.status(401).json({ message: 'Your Google email address is not verified' });
    }

    const email = payload.email.toLowerCase();

    // 1. Returning Google member.
    let user = await User.findOne({ googleId: payload.sub });

    // 2. Existing account under the same (Google-verified) address — link it.
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = payload.sub;
        if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
        await user.save();
      }
    }

    // 3. Brand new member. Same PENDING default as an email signup, so Google
    //    does not become a way around admin approval.
    let created = false;
    if (!user) {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        googleId: payload.sub,
        avatarUrl: payload.picture,
      });
      created = true;
    }

    const blocked = blockedReason(user.status);
    if (blocked) return res.status(403).json({ message: blocked });

    return issueSession(res, user, created ? 201 : 200);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response) {
  res.json({ user: req.user });
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(data.currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = data.newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}
