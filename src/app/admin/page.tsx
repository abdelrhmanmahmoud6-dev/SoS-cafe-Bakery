import { listOrders } from "@/app/actions/orders";
import { OrdersBoard } from "./OrdersBoard";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const initial = await listOrders({ limit: 60 });
  return <OrdersBoard initial={initial} />;
}
