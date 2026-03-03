import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { UserDataProvider } from "./context/UserDataContext";
import AppRoutes from "./routes";

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
    Loading...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UserDataProvider>
        <CartProvider>
          <TooltipProvider>
            <ScrollToTop />
            <Toaster />
            <Sonner />
            <Suspense fallback={<RouteFallback />}>
              <AppRoutes />
            </Suspense>
          </TooltipProvider>
        </CartProvider>
      </UserDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
