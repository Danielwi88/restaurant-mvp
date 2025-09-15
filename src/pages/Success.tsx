import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import { formatCurrency } from "@/lib/format";
import dayjs from "dayjs";

type Summary = {
  date: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  itemsCount: number;
};

export default function Success(){
  const loc = useLocation() as unknown as { state?: { summary?: Summary }};
  const s: Summary | undefined = loc?.state?.summary;
  const dateStr = s ? dayjs(s.date).format("DD MMMM YYYY, HH:mm") : dayjs().format("DD MMMM YYYY, HH:mm");
  const subtotal = s?.subtotal ?? 0;
  const deliveryFee = s?.deliveryFee ?? 0;
  const serviceFee = s?.serviceFee ?? 0;
  const total = s?.total ?? subtotal + deliveryFee + serviceFee;
  const itemsCount = s?.itemsCount ?? 0;
  const method = s?.paymentMethod ?? "—";

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="mb-6 text-[var(--color-brand,#D22B21)] font-semibold text-[22px] flex items-center gap-2">
        <span className="inline-block size-6 rounded-full bg-[var(--color-brand,#D22B21)]" /> Foody
      </div>
      <div className="relative">
        {/* side notches */}
        <span className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-white border border-neutral-200" aria-hidden="true" />
        <span className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-white border border-neutral-200" aria-hidden="true" />
        <Card className="max-w-md w-full text-left rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <div className="p-6 text-center">
              <div className="mx-auto mb-3 size-12 rounded-full bg-emerald-100 grid place-items-center">
                <span className="text-emerald-600 text-2xl">✓</span>
              </div>
              <div className="text-[20px] font-semibold">Payment Success</div>
              <p className="text-zinc-600 text-sm mt-1">Your payment has been successfully processed.</p>
            </div>
            <div className="border-t border-dashed border-neutral-200" />
            <div className="p-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-600">Date</span><span className="font-medium">{dateStr}</span></div>
              <div className="flex justify-between"><span className="text-zinc-600">Payment Method</span><span className="font-medium">{method}</span></div>
              <div className="flex justify-between"><span className="text-zinc-600">Price ({itemsCount} {itemsCount===1?'item':'items'})</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-600">Delivery Fee</span><span className="font-semibold">{formatCurrency(deliveryFee)}</span></div>
              <div className="flex justify-between"><span className="text-zinc-600">Service Fee</span><span className="font-semibold">{formatCurrency(serviceFee)}</span></div>
              <div className="border-t border-dashed border-neutral-200 pt-3 flex justify-between font-bold">
                <span>Total</span><span>{formatCurrency(total)}</span>
              </div>
              <Button asChild className="w-full mt-2 rounded-full bg-[var(--color-brand,#D22B21)]">
                <Link to="/orders">See My Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
