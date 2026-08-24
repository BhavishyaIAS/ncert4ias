import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaNotFound } from "@/components/bhavishya/states";

function ClassicNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This page doesn&apos;t exist, or the content isn&apos;t published yet.
        </p>
        <Button render={<Link href="/" />} className="mt-6">
          Back home
        </Button>
      </div>
    </main>
  );
}

export default function NotFound() {
  return (
    <ThemedPage classic={<ClassicNotFound />} bhavishya={<BhavishyaNotFound />} />
  );
}
