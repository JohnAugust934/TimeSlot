import { Suspense } from 'react';

import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-[#10213c] px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
            TimeSlot Web
          </p>
          <h1 className="mt-6 max-w-lg font-serif text-5xl leading-tight">
            Operacao de agenda clara, elegante e pronta para crescer com varios profissionais.
          </h1>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-white/8 p-5">
          <p className="text-sm text-white/70">
            Dashboard, agenda, clientes, servicos e equipe no mesmo fluxo.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-line bg-white/92 p-8 shadow-panel backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate">
            Acesso autenticado
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-ink">Entrar no painel</h2>
          <p className="mt-2 text-sm text-slate">
            Use suas credenciais para acessar a operacao do sistema.
          </p>
          <div className="mt-8">
            <Suspense fallback={<div className="text-sm text-slate">Carregando formulario...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
