import { LoginForm } from "@/features/auth/components/LoginForm"

export default async function LoginPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string; message?: string }> 
}) {
  const params = await searchParams;
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <LoginForm error={params.error} message={params.message} />
      </div>
    </div>
  )
}
