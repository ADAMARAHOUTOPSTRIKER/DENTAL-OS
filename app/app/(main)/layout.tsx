import AppShell from "@/components/app/AppShell";
import { ModalProvider } from "@/components/app/ModalProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModalProvider>
      <AppShell>{children}</AppShell>
    </ModalProvider>
  );
}
