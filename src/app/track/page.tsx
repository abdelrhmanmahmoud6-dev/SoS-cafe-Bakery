import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { TrackPageHeader } from "./TrackPageHeader";
import { TrackClient } from "./TrackClient";

export const metadata: Metadata = {
  title: "تتبع الطلب — Track your order",
  description:
    "تابع حالة طلبك من SOS Bakery And Coffee لحظة بلحظة برقم الطلب.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; orderId?: string }>;
}) {
  // `orderId` is what the WhatsApp receipt links to; `code` is kept so links
  // shared before that change still resolve.
  const { code, orderId } = await searchParams;
  const initial = orderId ?? code ?? "";

  return (
    <>
      <Navbar />
      <main
        id="main"
        className="relative isolate min-h-dvh overflow-hidden px-5 pb-24 pt-32 sm:px-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-96 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(202_138_4/0.12),transparent_70%)]"
        />
        <div className="relative z-10">
          <TrackPageHeader />
          <TrackClient initialCode={initial} />
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
