import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaAuthForm } from "@/components/bhavishya/auth";

export const metadata: Metadata = { title: "Sign in" };

async function ClassicLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back to NCERT4IAS.
        </p>
      </div>
      <LoginForm next={next ?? "/"} />
    </div>
  );
}

async function BhavishyaLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <BhavishyaAuthForm mode="signin" next={next ?? "/"} />;
}

export default function LoginPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <ThemedPage
      classic={<ClassicLoginPage {...props} />}
      bhavishya={<BhavishyaLoginPage {...props} />}
    />
  );
}
