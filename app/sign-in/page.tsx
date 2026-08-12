import { SignInForm } from "./sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="auth-page">
      <SignInForm confirmationError={params.error === "confirmation"} />
    </div>
  );
}
