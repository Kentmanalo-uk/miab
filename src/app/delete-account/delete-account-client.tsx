'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '@/firebase';
import {
  ReauthCancelledError,
  WrongPasswordError,
  deleteAccountAndData,
  usesPassword,
  type DeletionStep,
} from '@/lib/account';
import { siteConfig } from '@/lib/site-config';

/**
 * The interactive half of /delete-account.
 *
 * The surrounding page is server-rendered so the policy text is readable — and
 * indexable, and reviewable by Google — without any JavaScript. Only the part
 * that needs an authenticated session lives here.
 *
 * Anonymous visitors are shown the sign-in route rather than a dead form: every
 * visitor to this site is technically "signed in" anonymously, and treating
 * that session as an account to delete would offer a ceremony with nothing
 * behind it.
 */

const STEP_LABEL: Record<DeletionStep, string> = {
  reauthenticating: 'Verifying it is you…',
  messages: 'Deleting your messages…',
  reviews: 'Deleting your reviews…',
  local: 'Clearing this browser…',
  account: 'Closing your account…',
};

export function DeleteAccountClient() {
  const { user, isUserLoading } = useUser();
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<DeletionStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ messages: number; reviews: number } | null>(
    null
  );

  const isWorking = step !== null;
  const hasAccount = !!user && !user.isAnonymous;
  const needsPassword = !!user && usesPassword(user);

  const confirm = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const summary = await deleteAccountAndData(user, password, setStep);
      setStep(null);
      setPassword('');
      setDone({
        messages: summary.messagesDeleted,
        reviews: summary.reviewsDeleted,
      });
    } catch (e) {
      setStep(null);
      if (e instanceof WrongPasswordError || e instanceof ReauthCancelledError) {
        setError(e.message);
        return;
      }
      console.error('Account deletion failed:', e);
      setError(
        'Something went wrong and your account was not deleted. Please try again, or email us using the address below.'
      );
    }
  }, [user, password]);

  if (done) {
    return (
      <Card className="mt-8">
        <CardContent className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Your account has been deleted
          </h2>
          <p className="text-sm text-muted-foreground">
            We removed {done.messages} message
            {done.messages === 1 ? '' : 's'} and {done.reviews} review
            {done.reviews === 1 ? '' : 's'}, along with your account and what
            this browser had stored.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to the site</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isUserLoading) {
    return (
      <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your session…
      </p>
    );
  }

  if (!hasAccount) {
    return (
      <Card className="mt-8">
        <CardContent className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Sign in to delete your account
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in with the account you want deleted, then come back to this
            page. If you cannot sign in, email{' '}
            <a
              href={`mailto:${siteConfig.contactEmail}?subject=Account%20deletion%20request`}
              className="underline hover:text-foreground"
            >
              {siteConfig.contactEmail}
            </a>{' '}
            from the address on the account and we will delete it for you.
          </p>
          <Button asChild>
            <Link href="/auth">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 border-destructive/40">
      <CardContent className="space-y-4 p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Delete {user?.email ?? 'your account'}
        </h2>

        {needsPassword ? (
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm your password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isWorking}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You will be asked to confirm with Google before anything is deleted.
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {step && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {STEP_LABEL[step]}
          </p>
        )}

        <Button
          variant="destructive"
          onClick={confirm}
          disabled={isWorking || (needsPassword && !password)}
          className="w-full"
        >
          {isWorking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete my account permanently
        </Button>
      </CardContent>
    </Card>
  );
}
