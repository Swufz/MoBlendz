import { redirect } from "next/navigation";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  redirect(ref ? `/booking?ref=${encodeURIComponent(ref)}` : "/booking");
}
