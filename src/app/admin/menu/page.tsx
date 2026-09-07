import { listMenuForAdmin } from "@/app/actions/admin";
import { MenuManager } from "./MenuManager";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const { items, categories } = await listMenuForAdmin();
  return <MenuManager initialItems={items} categories={categories} />;
}
