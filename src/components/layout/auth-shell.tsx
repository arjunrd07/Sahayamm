export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-canvas-dark px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-8 w-8 rounded-lg bg-ink dark:bg-white flex items-center justify-center">
            <span className="text-white dark:text-ink text-sm font-bold">S</span>
          </div>
          <span className="font-semibold text-lg">Sahayam</span>
        </div>
        <div className="card p-7">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
