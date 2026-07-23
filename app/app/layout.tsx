import { AppProvider } from "@/lib/i18n";
import { DataProvider } from "@/components/app/DataProvider";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <DataProvider>{children}</DataProvider>
    </AppProvider>
  );
}
