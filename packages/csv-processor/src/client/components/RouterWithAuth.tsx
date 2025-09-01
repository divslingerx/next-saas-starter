import { RouterProvider } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";

export function RouterWithAuth({ router }: { router: any }) {
  const auth = useAuth();
  
  // Don't render router until auth state is loaded
  // This ensures auth-guard doesn't need to poll
  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <RouterProvider 
      router={router} 
      context={{ auth, queryClient: router.options.context.queryClient }} 
    />
  );
}