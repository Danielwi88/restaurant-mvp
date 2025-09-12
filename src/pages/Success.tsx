import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Success(){
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="p-6">
          <div className="size-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-emerald-600 text-2xl">✓</span>
          </div>
          <div className="text-2xl font-semibold mb-2">Payment Success</div>
          <p className="text-zinc-600 mb-6">Your payment has been successfully processed.</p>
          <Button asChild className="w-full">
            <a href="/orders">See My Orders</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}