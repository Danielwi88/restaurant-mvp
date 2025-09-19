import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/features/store';
import GlobalModal from '@/components/GlobalModal';
import { Toaster } from '@/components/ui/sonner';
import type { ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  },
});

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={client}>
        {children}
        <GlobalModal />
        {/* Move the Sonner toaster lower by adding a top offset */}
        <Toaster
          position='top-right'
          offset={90}
          mobileOffset={70}
          richColors
          className='toaster group [--width:22rem] [--border-radius:14px]'
          toastOptions={{
            className: '!p-4 !text-sm',
            classNames: {
              title: 'text-base font-semibold',
              description: 'text-sm text-zinc-600',
              actionButton:
                'h-7 px-3 text-xs rounded-md bg-[var(--primary)] text-white',
              cancelButton: 'h-7 px-3 text-xs rounded-md border',
            },
          }}
        />
        {import.meta.env.DEV && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition='bottom-right'
          />
        )}
      </QueryClientProvider>
    </Provider>
  );
}
