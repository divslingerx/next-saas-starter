import { createContext, useContext, ReactNode } from "react";
import { authClient } from "@tmcdm/auth/client";
import type { Session } from "@tmcdm/auth/server";

export interface AuthContextType {
  user: Session["user"] | null;
  session: Session["session"] | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: typeof authClient.signIn;
  signOut: () => Promise<void>;
  signInWithHubSpot: (options?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Use Better Auth's built-in useSession hook
  const sessionData = authClient.useSession();

  const signInWithHubSpot = async (options?: any) => {
    await authClient.signIn.oauth2({
      providerId: "hubspot",
      ...options
    });
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      // Navigation will be handled by the component calling signOut
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: sessionData.data?.user || null,
        session: sessionData.data?.session || null,
        isLoading: sessionData.isPending || false,
        isAuthenticated: !!sessionData.data?.user,
        signIn: authClient.signIn,
        signOut: handleSignOut,
        signInWithHubSpot,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}