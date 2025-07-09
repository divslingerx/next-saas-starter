"use client";

import SignIn from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { Tabs } from "@/components/ui/tabs2";
import { oneTap } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    async function runOneTap() {
      try {
        await oneTap({
          fetchOptions: {
            onError: ({ error }: { error: Error }) => {
              toast.error(error.message ?? "An error occurred");
            },
            onSuccess: () => {
              toast.success("Successfully signed in");
              router.push("/dashboard");
            },
          },
        });
      } catch (error) {
        console.error("One Tap Error:", error);
        toast.error("Failed to sign in with One Tap");
      }
    }
    runOneTap().catch((error) => {
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
      );
    });
  }, [router]);

  return (
    <div className="w-full">
      <div className="flex w-full flex-col items-center justify-center md:py-10">
        <div className="md:w-[400px]">
          <Tabs
            tabs={[
              {
                title: "Sign In",
                value: "sign-in",
                content: <SignIn />,
              },
              {
                title: "Sign Up",
                value: "sign-up",
                content: <SignUp />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
