# Supabase auth emails

Copies of the login emails set in **Supabase → Authentication → Emails → Templates**. Supabase is the source of truth; these are here so the design is backed up and easy to edit. After changing a file, paste it into the matching template's **Source** tab and save.

| Supabase template | File | Subject |
|---|---|---|
| Confirm sign up | `confirm-sign-up.html` | Confirm your email for Curblit |
| Invite user | `invite-user.html` | You've been invited to Curblit |
| Magic link or OTP | `magic-link.html` | Your Curblit sign-in link |
| Change email address | `change-email.html` | Confirm your new email address |
| Reset password | `reset-password.html` | Reset your Curblit password |
| Reauthentication | `reauthentication.html` | {{ .Token }} is your Curblit verification code |

The logo is `public/email-logo.png` (served at https://curblit.com/email-logo.png; email apps can't show SVG). Links use `{{ .ConfirmationURL }}`, which sends people through `/auth/callback`.
