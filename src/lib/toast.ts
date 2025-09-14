import { toast } from 'sonner';

export type ToastVariant = 'default' | 'success' | 'error';

export function showToast(message: string, variant: ToastVariant = 'default') {
  if (variant === 'success') return toast.success(message);
  if (variant === 'error') return toast.error(message);
  return toast(message);
}
