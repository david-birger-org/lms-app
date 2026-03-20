import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] px-4 py-10">
      <SignUpForm />
    </main>
  );
}
