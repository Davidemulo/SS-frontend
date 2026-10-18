import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { ComparisonProvider } from "@/components/marketplace/InvoiceComparisonContext";

/**
 * Renders a component with the providers `InvoiceCard` needs now that it
 * carries the watchlist bell (#474): React Query for the registry hook and the
 * comparison context for the compare toggle.
 *
 * The wallet context intentionally stays at its disconnected default — these
 * tests are about the card, not the watchlist, and a disconnected wallet simply
 * disables the bell.
 */
export function renderWithCardProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ComparisonProvider>{ui}</ComparisonProvider>
    </QueryClientProvider>,
  );
}
