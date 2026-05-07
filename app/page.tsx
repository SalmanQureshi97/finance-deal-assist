import { Hydrated } from "@/components/hydrated";
import { UploadZone } from "@/components/upload/upload-zone";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <Logo />
        </div>
      </header>
      <Hydrated>
        <UploadZone />
      </Hydrated>
    </main>
  );
}
