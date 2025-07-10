import Link from "next/link";

import { LatestPost } from "@/app/_components/post";
import { client } from "@/lib/auth-client";
import { api, HydrateClient } from "@/trpc/server";
import { SignInButton, SignInFallback } from "@/components/sign-in-btn";
import { Suspense } from "react";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const { data: session } = await client.getSession();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }
  const features = [
    "Email & Password",
    "Organization | Teams",
    "Passkeys",
    "Multi Factor",
    "Password Reset",
    "Email Verification",
    "Roles & Permissions",
    "Rate Limiting",
    "Session Management",
  ];

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Create <span className="text-[hsl(280,100%,70%)]">T3</span> App
          </h1>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="https://create.t3.gg/en/usage/first-steps"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">First Steps →</h3>
              <div className="text-lg">
                Just the basics - Everything you need to know to set up your
                database and authentication.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="https://create.t3.gg/en/introduction"
              target="_blank"
            >
              <h3 className="text-2xl font-bold">Documentation →</h3>
              <div className="text-lg">
                Learn more about Create T3 App, the libraries it uses, and how
                to deploy it.
              </div>
            </Link>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {hello ? hello.greeting : "Loading tRPC query..."}
            </p>

            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-2xl text-white">
                {session && <span>Logged in as {session.user?.name}</span>}
              </p>
              <Suspense fallback={<SignInFallback />}>
                <SignInButton />
              </Suspense>
            </div>
          </div>

          {session?.user && <LatestPost />}
        </div>
        {/* BA Page Copy */}
        <div className="no-visible-scrollbar flex min-h-[80vh] items-center justify-center overflow-hidden px-6 md:px-0">
          <main className="row-start-2 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-center text-4xl font-bold text-black dark:text-white">
                Better Auth.
              </h3>
              <p className="text-center text-sm break-words md:text-base">
                Official demo to showcase{" "}
                <a
                  href="https://better-auth.com"
                  target="_blank"
                  className="italic underline"
                >
                  better-auth.
                </a>{" "}
                features and capabilities. <br />
              </p>
            </div>
            <div className="flex w-full flex-col gap-4 md:w-10/12">
              <div className="flex flex-col flex-wrap gap-3 pt-2">
                <div className="bg-secondary/60 border-y border-dotted py-2 opacity-80">
                  <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
                    <span className="text-center">
                      All features on this demo are implemented with Better Auth
                      without any custom backend code
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {features.map((feature) => (
                    <span
                      className="text-muted-foreground hover:text-foreground hover:border-foreground flex cursor-pointer items-center gap-1 border-b pb-1 text-xs transition-all duration-150 ease-in-out"
                      key={feature}
                    >
                      {feature}.
                    </span>
                  ))}
                </div>
              </div>

              <Suspense fallback={<SignInFallback />}>
                <SignInButton />
              </Suspense>
            </div>
          </main>
        </div>
      </main>
    </HydrateClient>
  );
}
