import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f4] px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#476454]">
            iBob Agent
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#142116]">Entrar</h1>
          <p className="mt-1 text-sm text-[#5c6b61]">
            Acesse o dashboard protegido do piloto.
          </p>
        </div>

        <div className="rounded-xl border border-[#d7ddd2] bg-white p-5 shadow-sm">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
