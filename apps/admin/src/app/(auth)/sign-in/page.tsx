"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SignIn from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { toast } from "sonner";

import { oneTap } from "@charmlabs/core";
import { Tabs } from "@charmlabs/ui/components/tabs2";

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
