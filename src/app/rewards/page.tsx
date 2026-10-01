import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data";

export default async function RewardsPage() {
  const { profile } = await getSessionProfile();
  if (!profile) redirect("/login?next=/%23loyalty");
  redirect(profile.role === "admin" ? "/admin" : "/#loyalty");
}
