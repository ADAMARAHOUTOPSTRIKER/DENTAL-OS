import { AppProvider } from "@/lib/i18n";
import Landing from "@/components/landing/Landing";

export default function Home() {
  return (
    <AppProvider>
      <Landing />
    </AppProvider>
  );
}
