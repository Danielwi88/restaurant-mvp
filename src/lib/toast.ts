import { toast } from 'sonner';
import React from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

export function showToast(message: string, variant: ToastVariant = 'default') {
  if (variant === 'success') return toast.success(message);
  if (variant === 'error') return toast.error(message);
  return toast(message);
}

// Show a toast at top-left with a Home action button
export function showHomeToast(message: string) {
  return toast.custom(
    () =>
      React.createElement(
        'div',
        {
          className:
            'rounded-xl bg-green-200 text-gray-950 shadow-xl px-3 py-2 text-sm flex items-center gap-3',
        },
        [
          
          React.createElement('span', { key: 'msg' }, message),
        ]
      ),
    { position: 'top-left', duration: 3500 }
  );
}
