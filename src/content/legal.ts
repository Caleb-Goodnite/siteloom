import { CREDIT_PACKS } from "@/config/plans";
import { site } from "@/config/site";

/**
 * Starting-point legal documents. They are reasonable defaults for a US-based SaaS but
 * are NOT legal advice — have a lawyer review them (and set NEXT_PUBLIC_LEGAL_ENTITY /
 * NEXT_PUBLIC_GOVERNING_LAW) before launch.
 */
const E = site.legal.entity;
const N = site.name;

export const legalDocs: Record<string, { title: string; description: string; body: string }> = {
  terms: {
    title: "Terms of Service",
    description: `The terms that govern your use of ${N}.`,
    body: `These Terms of Service ("Terms") govern your use of ${N} (the "Service"), operated by ${E} ("we", "us"). By creating an account or using the Service you agree to these Terms.

## 1. The Service
${N} lets you create websites with the help of artificial intelligence, edit them, and publish them on our hosting or download them.

## 2. Accounts
You must be at least 16 years old and provide accurate information. You're responsible for activity on your account and for keeping your login secure. One person or organization may not create multiple accounts to obtain additional free credits.

## 3. Your content
You own the content you provide and the websites you create ("Your Content"), including AI-generated output, to the extent permitted by law. You grant us a worldwide, non-exclusive license to host, store, reproduce and display Your Content solely to operate, secure and improve the Service and to show it at your request (for example, in the public showcase if you opt in). You're responsible for Your Content and for having the rights to anything you upload.

## 4. AI output
AI-generated content may be inaccurate, incomplete or similar to content generated for others. Review everything before you publish, especially facts about your business, prices, legal or medical statements, and claims about third parties. We insert placeholders instead of inventing business details, but you remain responsible for what you publish.

## 5. Acceptable use
You must follow our [Acceptable Use Policy](/legal/acceptable-use). We may review, refuse to publish, suspend or remove content or accounts that violate it, with or without notice.

## 6. Plans, credits and payment
Paid plans are billed in advance through Stripe on a monthly or yearly basis and renew automatically until canceled. Plan credits refresh each billing month and don't roll over; purchased top-up credits (${CREDIT_PACKS.map((p) => `${p.credits}`).join(", ")} credit packs) don't expire while your account is open. Credits have no cash value and are non-transferable. We automatically refund credits for generations that fail or don't change your site. You can cancel anytime in the billing portal; your plan remains active until the end of the paid period. Except where required by law, payments are non-refundable. We may change prices with at least 30 days' notice for existing subscriptions.

## 7. Hosting and forms
Published sites are served from our infrastructure. Form submissions from your site's visitors are stored for you and, on eligible plans, emailed to you. You're responsible for how you use visitor data, including providing any required privacy notice on your site.

## 8. Availability and changes
We work to keep the Service available but don't guarantee uninterrupted operation. We may change or discontinue features. If we discontinue the Service, we'll give reasonable notice so you can download your sites.

## 9. Termination
You may delete your account at any time in Settings. We may suspend or terminate accounts that violate these Terms or create risk for others. On termination, your published sites go offline and your data is deleted as described in our [Privacy Policy](/legal/privacy).

## 10. Disclaimers
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. We don't guarantee any search ranking, traffic or business result.

## 11. Limitation of liability
TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${E.toUpperCase()} WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR LOST PROFITS OR DATA. OUR TOTAL LIABILITY FOR ANY CLAIM IS LIMITED TO THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM.

## 12. Indemnity
You'll defend and indemnify us against claims arising from Your Content or your violation of these Terms.

## 13. Governing law
These Terms are governed by the laws of ${site.legal.governingLaw}, without regard to conflict-of-law rules.

## 14. Contact
Questions? Email [${site.supportEmail}](mailto:${site.supportEmail}).`,
  },
  privacy: {
    title: "Privacy Policy",
    description: `How ${N} collects, uses and protects personal information.`,
    body: `This policy explains what personal information ${E} ("we") collects when you use ${N}, and how we use it.

## Information we collect
- **Account information:** your email address, name and profile picture (if you sign in with Google or GitHub).
- **Your content:** prompts, uploaded images, generated websites, version history and settings.
- **Billing information:** handled by Stripe. We receive your plan, billing status and the last digits of your card, never your full card number.
- **Usage information:** credits used, generation logs and basic technical data (such as IP address and browser) used for security, abuse prevention and rate limiting.

## Information about your site's visitors
When people visit a site you publish with us, we record privacy-friendly, aggregated page-view counts (page, day and referring website) without cookies or cross-site tracking. IP addresses are used briefly for rate limiting and abuse prevention and are not stored with analytics. When visitors submit a form on your site, we store the submission for you. For that data you are the controller and we act as your processor.

## How we use information
To provide and improve the Service, generate and host your sites, process payments, send transactional emails (like form notifications and receipts), prevent fraud and abuse, and comply with law. We don't sell personal information.

## Service providers
We use trusted processors to run the Service: Supabase (database, authentication and file storage), Vercel (hosting), Stripe (payments), OpenRouter and the AI model providers it routes to (generating content from your prompts), and Resend (email). Prompts and site content are sent to AI providers only to produce your results.

## Retention
We keep your data while your account is open. Deleting your account (Settings → Delete account) removes your profile, projects, versions, form submissions and uploaded files. Backups may persist for a limited period. Billing records are kept as required by law.

## Your rights
Depending on where you live, you may have rights to access, correct, export or delete your personal information, and to object to certain processing. Most of this can be done in your account; for anything else email [${site.supportEmail}](mailto:${site.supportEmail}).

## Security
We use encryption in transit, row-level access controls and least-privilege keys. Generated sites are served from a separate domain and previews run in a sandbox so site code can't access your account.

## Children
${N} isn't directed to children under 16, and we don't knowingly collect their information.

## Changes
We'll post updates here and, for material changes, notify you by email.

## Contact
[${site.supportEmail}](mailto:${site.supportEmail})`,
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    description: `What you can and can't build and host with ${N}.`,
    body: `${N} is for building legitimate websites for yourself, your organization, or clients who asked you to. To keep the platform safe and trusted, you may not use it to create, publish or host:

## Prohibited
- **Phishing and impersonation:** sites that imitate another company, brand, government agency or person, including fake login, account-verification, delivery or payment pages.
- **Collecting sensitive credentials:** forms that request passwords, full payment card numbers, bank credentials, government ID numbers or crypto wallet recovery phrases. (Use a reputable payment provider's checkout link for payments.)
- **Scams and fraud:** fake stores, fake giveaways, investment or crypto "doubling" schemes, advance-fee fraud, fake reviews or misleading health claims.
- **Malware:** distributing malicious software or links, or deceptive download prompts.
- **Illegal content or services:** including the sale of illegal goods and services, or content infringing others' intellectual property.
- **Sexual content involving minors**, which we report to the appropriate authorities.
- **Sexually explicit content.**
- **Violence and hate:** content that promotes terrorism, violence, or harassment of people based on protected characteristics.
- **Spam and abuse of the Service:** bulk-created sites for spam or SEO manipulation, attempts to bypass limits, creating multiple accounts for free credits, or interfering with the Service.

## Enforcement
We check sites automatically before they go live and review reports from the public. We may block publishing, take sites offline, remove content and close accounts that break these rules, without refund where the violation is serious. Repeat or severe violations may be reported to law enforcement.

## Reporting
See something that breaks these rules? [Report it here](/report).`,
  },
};
