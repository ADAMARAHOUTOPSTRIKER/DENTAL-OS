import { AppProvider } from "@/lib/i18n";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProvider>{children}</AppProvider>;
}
