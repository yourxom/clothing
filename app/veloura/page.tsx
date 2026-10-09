import { redirect } from "next/navigation";

// The Veloura landing design is now the site homepage. Keep /veloura working by
// redirecting to it so any existing links don't 404.
export default function VelouraPage() {
  redirect("/");
}
