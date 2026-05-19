import { DraftsList } from "@/presenters/components/postcard-design/drafts/DraftsList";

export default function DraftsPage() {
  return (
    <main className="phone-shell">
      <div className="phone-frame paper-grain">
        <DraftsList />
      </div>
    </main>
  );
}
