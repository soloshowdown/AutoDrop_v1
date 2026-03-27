"use client";

import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-background p-8 rounded-2xl shadow-xl border">
        <SignIn path="/login" routing="path" signUpUrl="/signup" />
      </div>
    </div>
  );
}
