export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#172018]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d7ddd2] pb-5">
          <div>
            <p className="text-sm font-medium uppercase text-[#476454]">
              iBob Agent
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#142116] sm:text-4xl">
              Base Next.js pronta para evoluir.
            </h1>
          </div>
          <div className="rounded-md border border-[#bed0c5] bg-white px-4 py-3 text-sm text-[#34473b] shadow-sm">
            Deploy alvo: Hostinger
          </div>
        </header>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex flex-col justify-center gap-6">
            <div className="max-w-2xl">
              <p className="text-lg leading-8 text-[#34473b]">
                O projeto agora tem um app principal em Next.js, scripts de
                validacao e documentacao para deploy supervisionado na
                Hostinger.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Stack", "Next.js 16"],
                ["Runtime", "Node 24"],
                ["Status", "Build validado"],
              ].map(([label, value]) => (
                <div
                  className="rounded-lg border border-[#d7ddd2] bg-white p-4 shadow-sm"
                  key={label}
                >
                  <p className="text-sm text-[#5c6b61]">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-[#172018]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="flex flex-col justify-center">
            <div className="rounded-lg border border-[#d7ddd2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#172018]">
                Proximos passos
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#34473b]">
                <li>Confirmar plano Hostinger e metodo de deploy.</li>
                <li>Definir variaveis de ambiente sem expor secrets.</li>
                <li>Criar o primeiro commit e conectar repositorio remoto.</li>
                <li>Executar deploy somente com supervisao do usuario.</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
      </main>
  );
}
