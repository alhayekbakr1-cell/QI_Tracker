# Login email (OTP) setup

Why this document exists: on 2026-08-29 residents stopped receiving sign-in
passcodes. The Supabase auth log showed the request being **accepted**:

```
POST /auth/v1/otp → 200   user_recovery_requested
actor: bakr.alhayek.md@adventhealth.com
```

A `200` here means Supabase queued the mail. It does **not** mean the mail was
delivered. There is no application bug in this path — `signInWithOtp` in
`src/app/login/page.tsx` is doing the right thing. Everything below is project
configuration in the Supabase dashboard.

---

## Cause 1 — the built-in email service cannot serve real users

If **Authentication → Emails → SMTP Settings → Enable Custom SMTP** is off, the
project is on Supabase's built-in sender, which is explicitly development-only:

- roughly **2 emails per hour**, project-wide
- delivers **only to addresses belonging to members of your Supabase org**

A resident at `@adventhealth.com` is not an org member, so their mail is
accepted and dropped. This produces exactly the observed symptom: `200 OK`,
no email, no error anywhere.

**This must be fixed for the app to work for anyone but you.**

### Picking a sender domain

You probably cannot use `@adventhealth.com` as the *sender*. Doing so requires
publishing SPF and DKIM DNS records on `adventhealth.com`, which needs
AdventHealth IT. Two realistic paths:

1. **Send from a domain you control** (recommended to get unblocked today).
   You own `bakralhayek.com` — a subdomain such as `qi.bakralhayek.com` works
   well. Recipients still *receive* at `@adventhealth.com`; only the From
   address changes.
2. **Ask AdventHealth IT for an SMTP relay** on their Exchange infrastructure.
   Better long-term optics (mail comes from inside the institution) and better
   deliverability to institutional inboxes, but slower to obtain.

Do not skip domain verification. Unauthenticated mail to a large healthcare
Exchange tenant is very likely to be silently quarantined.

### Wiring the provider

Any SMTP provider works. Resend is the least friction:

1. Verify your sending domain in the provider and publish the SPF/DKIM records
   it gives you.
2. In **Authentication → Emails → SMTP Settings**, enable custom SMTP and fill in:

   | Field         | Value                                        |
   | ------------- | -------------------------------------------- |
   | Sender email  | `no-reply@qi.bakralhayek.com`                 |
   | Sender name   | `Athena Clinical Wisdom Registry`             |
   | Host          | `smtp.resend.com`                             |
   | Port          | `587`                                         |
   | Username      | `resend`                                      |
   | Password      | your provider API key                         |

3. Raise **Authentication → Rate Limits → emails sent per hour** above the
   built-in default of 2, or a normal onboarding session will throttle itself.

---

## Cause 2 — the template may contain no passcode

The login screen asks for a **6-digit code**. Supabase's stock Magic Link
template contains only `{{ .ConfirmationURL }}` — a clickable link and no
digits. If it was never customized, then even a delivered email is unusable,
because there is nothing to type.

Fix: paste [`supabase/templates/otp-email.html`](../supabase/templates/otp-email.html)
into **Authentication → Emails → Magic Link**. It renders `{{ .Token }}` as the
passcode and is table-based so it survives Outlook.

Keep the repo copy and the dashboard copy in sync by hand — Supabase does not
read templates from the repo.

---

## Verifying the fix

1. Request a code from the live login page.
2. Confirm arrival, and that the email shows six digits.
3. Re-check the auth log for a `verify` event following the `otp` event:

   ```sql
   select timestamp, event_message from logs
   where source = 'auth_logs' order by timestamp desc limit 10
   ```

If mail still does not arrive after custom SMTP is on, check the provider's own
delivery log — at that point the failure is downstream of Supabase, and is
usually the recipient domain quarantining an unauthenticated sender.

---

## Note on the two deployments

The failing request carried `referer: https://bakralhayek.github.io/QI_Tracker`,
while the site under active development is
`https://alhayekbakr1-cell.github.io/QI_Tracker`. Confirm which origin residents
are actually given, and make sure that origin is listed under
**Authentication → URL Configuration → Redirect URLs**. Codes typed by hand do
not depend on redirect URLs, but anything link-based does.
