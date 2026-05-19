import { redirect } from "next/navigation";

export default function ReviewIndexPage() {
  redirect("/map?fake=1");
}
