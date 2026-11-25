import { Suspense } from "react";
import { Discover } from "@/components/discover";

export const metadata = { title: "Find matches · IdeaMatch" };

export default function Page() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-28 pt-10 sm:px-8 sm:pt-14">
      <Suspense fallback={null}>
        <Discover />
      </Suspense>
    </main>
  );
}
