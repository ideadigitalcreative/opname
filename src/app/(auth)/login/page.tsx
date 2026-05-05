import { loginAction } from "./actions";
import { LoginForm } from "@/components/forms/login-form";

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusType = getSearchValue(resolvedSearchParams.statusType);
  const message = getSearchValue(resolvedSearchParams.message);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <LoginForm action={loginAction} message={message} statusType={statusType} />
        </div>
      </div>
    </main>
  );
}
