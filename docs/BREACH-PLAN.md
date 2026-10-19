# If Curblit gets hacked: breach plan

Keep this short plan handy. In a breach, speed and honesty matter most. This is not legal advice: if real personal data leaks, call a lawyer before sending notices.

## What we hold (and what we don't)

| Data | Where | Risk if leaked |
|---|---|---|
| Customer accounts: email, name, profile picture | Supabase | Medium. Emails can be phished. |
| Passwords | Supabase, **hashed** (never stored readable) | Low, but still tell people to change them |
| Card numbers | **Stripe only**. We never see full card numbers. | None on our side |
| Form submissions from customers' sites: visitor names, emails, phones, messages | Supabase, **deleted after 12 months**; card and Social Security numbers are removed before saving | Medium. This is other people's data. |
| Site content and images | Supabase | Low |

Forms are not allowed to collect health information, government ID numbers, card numbers or passwords (Terms §7, Acceptable Use Policy).

## The first hour: stop it

1. **Rotate every secret key.** Make new keys and update Vercel, then redeploy:
   - Supabase: secret key and database password
   - Stripe: secret key and webhook secret
   - OpenRouter, Resend and `CRON_SECRET`
2. **Sign everyone out:** in Supabase, rotate the JWT signing keys (Project Settings → JWT Keys). This ends every login session.
3. **Check who has access** to Supabase, Vercel, Stripe, GitHub and Resend. Remove anyone unexpected, and make sure 2-factor login is on for every account.
4. **If the attacker is still active,** take the app offline with a maintenance deploy. Customers' sites can stay up if they aren't affected.

## The first day: figure out what happened

- What was accessed? Check the Supabase logs, Vercel logs and the GitHub security log.
- Which tables, and how many people? Count customer accounts and form submissions separately.
- When did it start and end?
- Write everything down with times. You'll need it for notices, insurance and any lawyer.

## Within a few days: tell people

- **Customers (site owners):** email everyone whose account or site data was involved. Say what happened, what data, what you've done, and what they should do (change password, watch for phishing). Plain language, no hiding.
- **Their visitors:** if form submissions leaked, the site owner decides whether to notify their own visitors. We give them the list of affected submissions and the facts they need.
- **State laws:** every US state has a breach-notice law, based on where the *affected people* live, not where we are.
  - **Kansas** (K.S.A. 50-7a01 to 50-7a04) requires notice "without unreasonable delay" when a name leaks together with a Social Security number, driver's license or state ID number, or a financial account or card number with its access code. If more than 1,000 people are notified, the national credit bureaus must be told too.
  - **Some states** (such as California) also count an **email plus password** as personal information. If account passwords may be exposed, notify everyone even though they're hashed.
- **Stripe:** tell Stripe support if anything payment-related might be involved.
- **Insurance:** if Anchorforge Digital has cyber or general liability insurance, report it right away. Most policies require quick notice.

## Afterwards

- Fix the cause, then write a short note: what happened, how it was found, what changed so it can't happen again.
- Keep this file up to date when we start storing new kinds of data.

## Contacts

| Who | Where |
|---|---|
| Supabase support | https://supabase.com/dashboard/support/new |
| Vercel support | https://vercel.com/help |
| Stripe support | https://support.stripe.com |
| Kansas Attorney General (consumer protection) | https://ag.ks.gov |
| Lawyer | *(fill in)* |
| Insurance | *(fill in)* |

## Email template for customers

> **Subject: Security incident affecting your Curblit account**
>
> On [date], we discovered that [what happened]. The information involved was [list]. [Card numbers were not involved — payments are handled by Stripe.]
>
> We have [what you did: closed the gap, reset keys, signed everyone out]. We recommend you [change your password / watch for suspicious emails].
>
> We're sorry this happened. If you have questions, reply to this email or contact [support email].
>
> — [Name], Curblit (Anchorforge Digital)
