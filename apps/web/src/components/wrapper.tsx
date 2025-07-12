"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Wrapper(props: { children: React.ReactNode }) {
  return (
    <div className="dark:bg-grid-small-white/[0.2] bg-grid-small-black/[0.2] relative flex min-h-screen w-full justify-center bg-white dark:bg-black">
      <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] md:flex dark:bg-black"></div>
      <div className="border-border absolute z-50 flex w-full items-center justify-between border-b bg-white px-4 py-2 md:px-1 lg:w-8/12 dark:bg-black">
        <Link href="/">
          <div className="flex cursor-pointer gap-2">
            <Logo />
            <p className="text-black dark:text-white">BETTER-AUTH.</p>
          </div>
        </Link>
        <div className="z-50 flex items-center">
          <ThemeToggle />
        </div>
      </div>
      <div className="mt-20 w-full lg:w-7/12">{props.children}</div>
    </div>
  );
}

const queryClient = new QueryClient();

export function WrapperWithQuery(props: { children: React.ReactNode | any }) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
