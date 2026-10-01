import { redirect } from "next/navigation";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { SiteHeader } from "@/components/site-header";
import { getSessionProfile } from "@/lib/data";

export default async function ProfilePage() {
  const { profile } = await getSessionProfile();
  if (!profile) {
    redirect("/login?next=/profile");
  }
  if (profile.role === "admin") {
    redirect("/admin");
  }

  return (
    <>
      <SiteHeader profile={profile} />
      <main className="account-home account-flow account-profile">
        <div className="account-flow-content">
          <section className="account-page-intro" aria-labelledby="profile-title">
            <div className="account-wordmark" aria-hidden="true">MoBlendz</div>
            <div className="account-page-heading">
              <h1 id="profile-title">Edit your profile.</h1>
              <p>Keep your name, contact number, and profile picture up to date.</p>
            </div>
          </section>
          <div className="account-booking-form">
            <ProfileEditForm profile={profile} />
          </div>
        </div>
      </main>
    </>
  );
}
