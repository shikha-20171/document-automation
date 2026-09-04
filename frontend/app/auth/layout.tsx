import { ThemeToggle } from "@/components/layout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#eef2ff_35%,#f8fafc_70%)] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 dark:bg-[radial-gradient(circle_at_top_left,#1a1f38_0%,#10162a_35%,#0b1020_70%)]">
      <div className="fixed right-4 top-4 z-[60]">
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}
