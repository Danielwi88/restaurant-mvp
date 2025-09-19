import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "@/features/store";
import GlobalModal from "@/components/GlobalModal";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
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
        <Toaster position="top-right" offset={100} richColors />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
      </QueryClientProvider>
    </Provider>
  );
}
