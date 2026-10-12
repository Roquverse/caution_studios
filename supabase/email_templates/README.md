# Caution Studio — Supabase Email Templates

Professional transactional email templates designed in the minimalist aesthetic of **Apple** and **Google**:
- Zero AI gimmicks, no emojis, no neon glow borders
- Monospace 6-digit OTP code presentation (`34px`, `8px` letter-spacing)
- Bulletproof HTML layout with inline CSS tested for Gmail, Apple Mail, Outlook, iOS & Android
- Clean security disclaimers and company copyright footer

---

## 1. Confirm Signup (OTP Verification)
* **Supabase Location**: **Authentication** &rarr; **Email Templates** &rarr; **Confirm signup**
* **Subject**: `Your Caution Studio verification code: {{ .Token }}`
* **Template File**: [`supabase/email_templates/confirm_signup.html`](./confirm_signup.html)

---

## 2. Reset Password (Password Recovery)
* **Supabase Location**: **Authentication** &rarr; **Email Templates** &rarr; **Reset Password**
* **Subject**: `Reset your Caution Studio password`
* **Template File**: [`supabase/email_templates/reset_password.html`](./reset_password.html)

---

## 3. Magic Link (Passwordless Sign-In)
* **Supabase Location**: **Authentication** &rarr; **Email Templates** &rarr; **Magic Link**
* **Subject**: `Your Caution Studio sign-in code: {{ .Token }}`
* **Template File**: [`supabase/email_templates/magic_link.html`](./magic_link.html)

---

## 4. Change Email Address
* **Supabase Location**: **Authentication** &rarr; **Email Templates** &rarr; **Change Email Address**
* **Subject**: `Confirm your new Caution Studio email address`
* **Template File**: [`supabase/email_templates/change_email.html`](./change_email.html)

---

## How to Apply in Supabase Dashboard
1. Open your project dashboard: [https://supabase.com/dashboard/project/yvsoqighrijqqnojelgp/auth/templates](https://supabase.com/dashboard/project/yvsoqighrijqqnojelgp/auth/templates)
2. Select the template tab (e.g. **Confirm signup**).
3. Update the **Subject** line.
4. Paste the corresponding HTML into the **Body** field.
5. Click **Save Changes**.
