"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  authenticate,
  createSession,
  destroySession,
  requireAdmin,
} from "@/lib/auth";
import { toItemDTO, type MenuItemDTO } from "@/lib/menu-service";

/* ============================================================================
   AUTH
   ========================================================================== */

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "MISSING" };

  const session = await authenticate(email, password);
  if (!session) return { error: "INVALID" };

  await createSession(session);
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/* ============================================================================
   MENU CRUD
   ========================================================================== */

export interface MenuItemInput {
  id?: string;
  nameAr: string;
  nameEn: string;
  descAr?: string;
  descEn?: string;
  categoryId: string;
  /** Either a single price, or both L and XL. */
  price?: number | null;
  priceL?: number | null;
  priceXL?: number | null;
  imageUrl?: string | null;
  isBestSeller?: boolean;
  isAvailable?: boolean;
}

export type MutationResult =
  | { ok: true; item?: MenuItemDTO }
  | { ok: false; error: string };

function validateItem(input: MenuItemInput): string | null {
  if (!input.nameAr?.trim()) return "NAME_AR_REQUIRED";
  if (!input.nameEn?.trim()) return "NAME_EN_REQUIRED";
  if (!input.categoryId?.trim()) return "CATEGORY_REQUIRED";

  const hasSizes = input.priceL != null && input.priceXL != null;
  const hasSingle = input.price != null;

  if (!hasSizes && !hasSingle) return "PRICE_REQUIRED";
  if (hasSizes && hasSingle) return "PRICE_AMBIGUOUS";

  const amounts = hasSizes ? [input.priceL!, input.priceXL!] : [input.price!];
  for (const a of amounts) {
    if (!Number.isFinite(a) || a < 0 || a > 100000) return "PRICE_INVALID";
  }
  return null;
}

export async function createMenuItem(
  input: MenuItemInput
): Promise<MutationResult> {
  await requireAdmin();
  const invalid = validateItem(input);
  if (invalid) return { ok: false, error: invalid };

  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) return { ok: false, error: "CATEGORY_NOT_FOUND" };

  const hasSizes = input.priceL != null && input.priceXL != null;

  // Slugs are generated, and kept unique, from the category prefix.
  const count = await prisma.menuItem.count({
    where: { categoryId: input.categoryId },
  });
  const slug = `${input.categoryId}-new-${count + 1}-${Date.now().toString(36)}`;

  const row = await prisma.menuItem.create({
    data: {
      slug,
      nameAr: input.nameAr.trim(),
      nameEn: input.nameEn.trim(),
      descAr: input.descAr?.trim() || null,
      descEn: input.descEn?.trim() || null,
      categoryId: input.categoryId,
      price: hasSizes ? null : Math.round(input.price!),
      priceL: hasSizes ? Math.round(input.priceL!) : null,
      priceXL: hasSizes ? Math.round(input.priceXL!) : null,
      imageUrl: input.imageUrl || null,
      isBestSeller: input.isBestSeller ?? false,
      isAvailable: input.isAvailable ?? true,
      sortOrder: 9999,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/menu");
  return { ok: true, item: toItemDTO(row) };
}

export async function updateMenuItem(
  input: MenuItemInput
): Promise<MutationResult> {
  await requireAdmin();
  if (!input.id) return { ok: false, error: "ID_REQUIRED" };
  const invalid = validateItem(input);
  if (invalid) return { ok: false, error: invalid };

  const hasSizes = input.priceL != null && input.priceXL != null;

  try {
    const row = await prisma.menuItem.update({
      where: { id: input.id },
      data: {
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn.trim(),
        descAr: input.descAr?.trim() || null,
        descEn: input.descEn?.trim() || null,
        categoryId: input.categoryId,
        price: hasSizes ? null : Math.round(input.price!),
        priceL: hasSizes ? Math.round(input.priceL!) : null,
        priceXL: hasSizes ? Math.round(input.priceXL!) : null,
        imageUrl: input.imageUrl ?? null,
        isBestSeller: input.isBestSeller ?? false,
        isAvailable: input.isAvailable ?? true,
      },
    });
    revalidatePath("/");
    revalidatePath("/admin/menu");
    return { ok: true, item: toItemDTO(row) };
  } catch (err) {
    console.error("updateMenuItem failed:", err);
    return { ok: false, error: "NOT_FOUND" };
  }
}

export async function toggleAvailability(
  id: string,
  isAvailable: boolean
): Promise<MutationResult> {
  await requireAdmin();
  try {
    const row = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });
    revalidatePath("/");
    revalidatePath("/admin/menu");
    return { ok: true, item: toItemDTO(row) };
  } catch {
    return { ok: false, error: "NOT_FOUND" };
  }
}

export async function deleteMenuItem(id: string): Promise<MutationResult> {
  await requireAdmin();

  // An item referenced by a past order must not be destroyed — that would
  // rewrite history. Retire it from the menu instead.
  const referenced = await prisma.orderItem.count({ where: { menuItemId: id } });
  if (referenced > 0) {
    await prisma.menuItem.update({ where: { id }, data: { isAvailable: false } });
    revalidatePath("/");
    revalidatePath("/admin/menu");
    return { ok: false, error: "IN_USE_HIDDEN_INSTEAD" };
  }

  try {
    await prisma.menuItem.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/admin/menu");
    return { ok: true };
  } catch {
    return { ok: false, error: "NOT_FOUND" };
  }
}

/** Full menu for the admin table, including unavailable items. */
export async function listMenuForAdmin(): Promise<{
  items: MenuItemDTO[];
  categories: { id: string; ar: string; en: string }[];
}> {
  await requireAdmin();
  const [items, categories] = await Promise.all([
    prisma.menuItem.findMany({ orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }] }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    items: items.map(toItemDTO),
    categories: categories.map((c) => ({ id: c.id, ar: c.nameAr, en: c.nameEn })),
  };
}
