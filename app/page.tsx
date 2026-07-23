import { redirect } from "next/navigation";

// Demo entry point: skip the marketing landing and go straight to role selection.
export default function Home() {
  redirect("/app");
}
