-- Delivery area for DELIVERY orders.
--   INSIDE  = inside Housh Eissa, flat fee charged at checkout
--   OUTSIDE = nearby villages, courier agrees the fee on delivery
-- Nullable and with no default, so takeaway orders and every order placed
-- before this column existed stay valid without a backfill.
ALTER TABLE "orders" ADD COLUMN "deliveryArea" TEXT;
