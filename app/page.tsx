import { AppProvider } from "@/lib/i18n";
import Landing from "@/components/landing/Landing";

// La vitrine est la porte d'entrée du produit ; la démo interactive vit sous
// /app. Le layout racine ne fournit pas AppProvider (la section /app a le
// sien), on l'enveloppe donc ici — le landing n'a besoin que de la langue.
export default function Home() {
  return (
    <AppProvider>
      <Landing />
    </AppProvider>
  );
}
