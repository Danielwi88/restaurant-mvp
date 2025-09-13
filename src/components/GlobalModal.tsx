import { useAppDispatch, useAppSelector } from "@/features/store";
import { closeModal } from "@/features/ui/uiSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function GlobalModal() {
  const { modal } = useAppSelector((s) => s.ui);
  const d = useAppDispatch();

  const onOpenChange = (open: boolean) => {
    if (!open) d(closeModal());
  };

  const content = (() => {
    if (modal.id === "share") {
      const payload = modal.payload as { title?: string; url?: string } | undefined;
      const url = payload?.url ?? (typeof window !== 'undefined' ? window.location.href : "");
      const title = payload?.title ?? "Share";
      return (
        <div className="space-y-3">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-zinc-700 break-all border rounded-md p-2 bg-zinc-50">{url}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => d(closeModal())}>Close</Button>
            <Button onClick={() => { navigator.clipboard?.writeText(url); d(closeModal()); }}>Copy Link</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <DialogHeader>
          <DialogTitle>Modal</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-zinc-700">No content configured for modal id: {String(modal.id)}</div>
        <div className="flex justify-end"><Button onClick={() => d(closeModal())}>Close</Button></div>
      </div>
    );
  })();

  return (
    <Dialog open={modal.open} onOpenChange={onOpenChange}>
      <DialogContent>{content}</DialogContent>
    </Dialog>
  );
}

