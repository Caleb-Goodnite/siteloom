import { CREDIT_PACKS } from "@/config/plans";
import { site } from "@/config/site";

/**
 * Product legal disclosures. These are not legal advice; have counsel review them
 * against the operating entity, applicable jurisdictions, and actual vendor terms.
 */
const E = site.legal.entity;
const N = site.name;

export const legalDocs: Record<string, { title: string; description: string; body: string }> = {
  terms: {
    title: "Terms of Service",
    description: `The terms that govern your use of ${N}.`,
    body: `These Terms of Service ("Terms") govern your use of ${N} (the "Service"), operated by ${E} ("we", "us"). By creating an account or using the Service you agree to these Terms.

## 1. The Service
${N} lets you create websites with the help of artificial intelligence, edit them, and publish them on our hosting or download them. Features, usage limits and prices may change as the Service develops.

## 2. Accounts
You must be at least 16 years old and provide accurate information. You're responsible for activity on your account and for keeping your login secure. One person or organization may not create multiple accounts to obtain additional free credits.

## 3. Your content
You retain your rights to the content you provide and the websites you create ("Your Content"). To the extent permitted by law, you may use AI-generated output, but it may not be unique or protectable. You grant us a worldwide, non-exclusive license to host, store, reproduce, modify as technically necessary, and display Your Content only to provide, secure and maintain the Service and to show it as you direct (for example, in the public showcase if you opt in). You're responsible for Your Content and for having the rights to anything you upload.

## 4. AI output
AI-generated content may be inaccurate, incomplete or similar to content generated for others. Review everything before you publish, especially facts about your business, prices, legal or medical statements, and claims about third parties. We insert placeholders instead of inventing business details, but you remain responsible for what you publish.

## 5. Acceptable use
You must follow our [Acceptable Use Policy](/legal/acceptable-use). We may review, refuse to publish, suspend or remove content or accounts that violate it, with or without notice.

## 6. Plans, credits and payment
Paid plans are billed in advance through Stripe on a monthly or yearly basis and renew automatically until canceled. Free-plan credits refresh daily; paid-plan credits refresh monthly and don't roll over. Purchased top-up credit packs (${CREDIT_PACKS.map((p) => `${p.credits}`).join(", ")} credits) don't expire while your account remains open. Credits have no cash value and are non-transferable. Credits used for a generation that fails or makes no changes are returned to your Curblit account; this is not a cash refund. You can cancel anytime in the billing portal; your plan remains active until the end of the paid period. Except where required by law, payments are non-refundable. We may change prices with at least 30 days' notice for existing subscriptions.

## 7. Hosting and forms
Published sites are served from our infrastructure. Form submissions from your site's visitors are stored for you for up to 12 months, then deleted automatically, and, on eligible plans, emailed to you. Download or forward anything you need to keep longer. You're responsible for how you use visitor data, including providing any required privacy notice on your site.

Forms are for everyday contact details and requests (like a name, email, phone number, address or a message). Don't use them to collect sensitive information: health or medical information (including anything covered by HIPAA), Social Security or other government ID numbers, payment card or bank account numbers, passwords, or information about children under 13. ${N} is not designed or certified for that kind of data, and we automatically remove anything that looks like a card or Social Security number from submissions. If your business needs to collect sensitive information, link to a service built for it, such as a HIPAA-compliant patient intake form or a payment provider's checkout.

## 8. Availability and changes
We work to keep the Service available but don't guarantee uninterrupted operation. We may change or discontinue features. If we discontinue the Service, we'll give reasonable notice so you can download your sites.

## 9. Termination
You may request account deletion in Settings. We may suspend or terminate accounts that violate these Terms or create risk for others. When an account is deleted, published sites go offline and associated data is deleted as described in our [Privacy Policy](/legal/privacy), subject to legal retention requirements, backups and third-party provider retention.

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
    body: `This policy explains what personal information ${E} ("we") collects when you use ${N}, and how we use it. When you publish a site for your own visitors, you are responsible for the privacy notices and legal obligations that apply to your site and the information it collects.

## Information we collect
- **Account information:** your email address, name and profile picture (if you sign in with Google or GitHub).
- **Your content:** prompts, uploaded images, generated websites, version history and settings.
- **Billing information:** handled by Stripe. We receive your plan, billing status and the last digits of your card, never your full card number.
- **Usage information:** credits used, generation logs and basic technical data (such as IP address and browser) used for security, abuse prevention and rate limiting.

## Information about your site's visitors
When people visit a site you publish with us, our built-in analytics store aggregated page-view counts by page, day and referral source; these records do not contain visitor names or IP addresses. IP addresses may be processed in short-lived security and rate-limit records, which are routinely cleaned up. When visitors submit a form on your site, we store the submission for you for up to 12 months and then delete it automatically. Before storing it, we remove anything that looks like a payment card or Social Security number. You decide what information to request and how to use it, and are responsible for the notices and permissions required for that collection. Forms must not be used to collect sensitive information such as health details or government ID numbers (see our Acceptable Use Policy).

## Cookies and analytics on ${N}
We use cookies needed for functions such as authentication and referral attribution. Your theme and some interface preferences are saved in your browser's local storage. We use Vercel Web Analytics on ${N}; it does not use cookies, but uses a request-derived identifier for aggregated analytics and does not track visitors across unrelated sites. Optional Google Analytics or Meta Pixel scripts may be enabled on ${N} through configuration, and customers may add those tools to their published sites. Those services may use cookies or similar technologies. If you enable them, you are responsible for any notices or consent required by applicable law.

## How we use information
To provide and improve the Service, generate and host your sites, process payments, send transactional emails (like form notifications and receipts), prevent fraud and abuse, and comply with law. We don't sell personal information.

## Service providers
We use service providers to run the Service, including Supabase (database, authentication and file storage), Vercel (hosting and analytics), Stripe (payments), OpenRouter and the model providers it routes to (AI generation), and Resend (email). When you request AI generation, relevant prompts and site content are sent to OpenRouter and the selected model provider to produce the result. Provider privacy, security and retention terms may apply to that processing; don't include sensitive information in prompts unless you are comfortable sharing it for generation.

## Retention
We keep account data while your account is open. Form submissions from your sites' visitors are deleted automatically 12 months after they're received. When you request account deletion in Settings, we cancel an active subscription where possible, take published sites offline and delete associated account records and files. Some information may remain temporarily in backups, in provider systems under their retention policies, or where needed for legal, accounting, security or fraud-prevention purposes.

## Your rights
Depending on where you live, you may have rights to access, correct, delete or restrict certain processing of your personal information. You can update some account details or request account deletion in Settings. For other requests, email [${site.supportEmail}](mailto:${site.supportEmail}).

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
- **Collecting sensitive information:** forms that request passwords, full payment card numbers, bank credentials, Social Security or other government ID numbers, crypto wallet recovery phrases, health or medical information, or information about children under 13. (Use a reputable payment provider's checkout link for payments, and a HIPAA-compliant service for patient intake.)
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
