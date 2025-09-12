import { useOrders } from "@/services/queries/orders";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function Orders(){
  const { data, isLoading } = useOrders();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">My Orders</h2>

      {isLoading && (
        <div className="text-zinc-500">Loading orders…</div>
      )}

      <div className="space-y-4">
        {data?.map(o => (
          <Card key={o.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{new Date(o.createdAt).toLocaleString()}</div>
                  <div className="text-xs text-zinc-500">{o.status ?? "DONE"}</div>
                </div>
                <div className="font-bold">{formatCurrency(o.total)}</div>
              </div>

              <ul className="text-sm text-zinc-700 list-disc ml-5">
                {o.items.map(i => <li key={i.id}>{i.name} × {i.qty}</li>)}
              </ul>

              <div className="flex justify-end">
                <Button variant="outline">Give Review</Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && !data?.length && (
          <Card><CardContent className="p-6 text-center text-zinc-500">No orders yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}