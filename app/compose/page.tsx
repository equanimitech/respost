import { ComposerFlow } from "@/presenters/components/postcard-design/compose-flow/ComposerFlow";

export const dynamic = "force-dynamic";

export default function ComposePage() {
  const sender = process.env.RESPOST_SENDER_NAME ?? "Rafa";
  const place = process.env.RESPOST_SENDER_PLACE ?? undefined;

  return (
    <main className="phone-shell">
      <div className="phone-frame">
        <ComposerFlow defaultSender={sender} defaultPlace={place} />
      </div>
    </main>
  );
}
