"use client";

import { SignUp } from '@clerk/nextjs';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-background p-8 rounded-2xl shadow-xl border">
        <SignUp path="/signup" routing="path" signInUrl="/login" />
      </div>
    </div>
  );
}
