interface RoutePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function RoutePlaceholder({
  eyebrow,
  title,
  description
}: RoutePlaceholderProps) {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl items-center">
        <div className="w-full rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-[#1E40AF]">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[#0F172A] md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748B]">
            {description}
          </p>
        </div>
      </section>
    </main>
  );
}
