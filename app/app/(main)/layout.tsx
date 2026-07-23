import AppShell from "@/components/app/AppShell";
import { DataProvider } from "@/components/app/DataProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}
