import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";
import { ThemedPage } from "@/components/themed-page";
import { BhavishyaAuthForm } from "@/components/bhavishya/auth";

export const metadata: Metadata = { title: "Create account" };

function ClassicSignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Start climbing the ladder, one NCERT chapter at a time.
        </p>
      </div>
      <SignupForm />
    </div>
  );
}

export default function SignupPage() {
  return (
    <ThemedPage
      classic={<ClassicSignupPage />}
      bhavishya={<BhavishyaAuthForm mode="signup" next="/" />}
    />
  );
}
