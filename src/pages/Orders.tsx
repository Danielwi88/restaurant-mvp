import { useState, useMemo } from "react";
import { useOrders } from "@/services/queries/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LogOutIcon, MapPinIcon, ReceiptIcon, StarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview } from "@/services/queries/reviews";

type StatusTab = "preparing" | "on_the_way" | "delivered" | "done" | "canceled" | "all";

export default function Orders(){
  const [status, setStatus] = useState<StatusTab>("all");
  const [q, setQ] = useState("");
  const { data, isLoading } = useOrders(status === "all" ? undefined : { status });
  const createReview = useCreateReview();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [current, setCurrent] = useState<{ tx?: string; rid?: string; rname?: string } | null>(null);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter(o =>
      o.items.some(i => i.name.toLowerCase().includes(s))
      || new Date(o.createdAt).toLocaleString().toLowerCase().includes(s)
    );
  }, [data, q]);

  const tabs: { id: StatusTab; label: string }[] = [
    { id: "preparing", label: "Preparing" },
    { id: "on_the_way", label: "On the Way" },
    { id: "delivered", label: "Delivered" },
    { id: "done", label: "Done" },
    { id: "canceled", label: "Canceled" },
    { id: "all", label: "All" },
  ];

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[220px,1fr] gap-6">
        {/* Left menu */}
        <aside className="hidden md:block">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="font-medium">John Doe</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-700"><MapPinIcon className="size-4"/> Delivery Address</div>
                <div className="flex items-center gap-2 font-semibold"><ReceiptIcon className="size-4 text-[var(--color-brand,#D22B21)]"/> My Orders</div>
                <button className="flex items-center gap-2 text-red-600"><LogOutIcon className="size-4"/> Logout</button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Right content */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">My Orders</h2>
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Input placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} className="max-w-xs" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={()=>setStatus(t.id)}
                    className={`px-3 py-1.5 rounded-full border text-sm ${status===t.id?"bg-[var(--color-brand,#D22B21)] text-white border-transparent":"bg-white text-zinc-700 border-neutral-300"}`}
                  >{t.label}</button>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                {isLoading && (
                  <div className="text-zinc-500">Loading orders…</div>
                )}

                {!isLoading && filtered.map((o) => {
                  const first = o.items[0];
                  const summary = first ? `${first.qty} × ${formatCurrency(first.price)}` : "";
                  return (
                    <Card key={o.id} className="rounded-xl border border-neutral-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={first?.imageUrl || '/fallback1.png'} alt={first?.name || 'food'} className="size-12 rounded-md object-cover" onError={(e)=>{ const img=e.currentTarget as HTMLImageElement; if(!img.src.includes('/fallback1.png')){ img.onerror=null; img.src='/fallback1.png'; }}} />
                          <div className="flex-1">
                            <div className="font-medium">{first?.name || 'Order'}</div>
                            <div className="text-xs text-zinc-600">{summary}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-zinc-500">Total</div>
                            <div className="font-bold">{formatCurrency(o.total)}</div>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button className="rounded-full px-5" onClick={() => { setCurrent({ tx: o.transactionId, rid: o.restaurantId, rname: o.restaurantName }); setReviewOpen(true); }}>Give Review</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {!isLoading && filtered.length === 0 && (
                  <Card><CardContent className="p-6 text-center text-zinc-500">No orders found.</CardContent></Card>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />

      {/* Give Review Modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Give Review</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-zinc-700">Give Rating</div>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const idx = i + 1; const active = rating >= idx;
              return (
                <button key={idx} aria-label={`rate ${idx}`} onClick={() => setRating(idx)}>
                  <StarIcon className={`size-6 ${active ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-300'}`} />
                </button>
              );
            })}
          </div>
          <Textarea
            placeholder="Please share your thoughts about our service!"
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>)=>setComment(e.target.value)}
            className="mt-3 min-h-28"
          />
          <Button
            className="mt-4 rounded-full"
            disabled={createReview.isPending || !current?.tx || !current?.rid}
            onClick={() => {
              if (!current?.tx || !current?.rid) return;
              const ridNum = Number(current.rid);
              createReview.mutate({
                transactionId: current.tx,
                restaurantId: Number.isFinite(ridNum) ? ridNum : (current.rid as string),
                star: rating,
                comment: comment.trim(),
              }, {
                onSuccess: () => { setReviewOpen(false); setComment(""); },
              });
            }}
          >
            {createReview.isPending ? 'Sending…' : 'Send'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
