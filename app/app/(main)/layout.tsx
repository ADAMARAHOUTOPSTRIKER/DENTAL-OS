import AppShell from "@/components/app/AppShell";
import { DataProvider } from "@/components/app/DataProvider";
import { ModalProvider } from "@/components/app/ModalProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataProvider>
      <ModalProvider>
        <AppShell>{children}</AppShell>
      </ModalProvider>
    </DataProvider>
  );
}
