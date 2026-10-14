import { SettingsForm } from "@/components/app/settings-form";
import { getProfile, requireUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  const profile = await getProfile(user.id);
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-5xl text-ink">Settings</h1>
      <SettingsForm
        email={profile.email}
        name={profile.full_name ?? ""}
        emailNotifications={profile.email_notifications}
        marketingEmails={profile.marketing_emails ?? true}
        hasSubscription={Boolean(profile.stripe_subscription_id)}
      />
    </div>
  );
}
