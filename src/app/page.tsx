import ScrollyCanvas from '@/components/ScrollyCanvas';
import Overlay from '@/components/Overlay';
import NanoBanana from '@/components/NanoBanana';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] selection:bg-zinc-800 selection:text-white">
      <ScrollyCanvas>
        <Overlay />
      </ScrollyCanvas>
      <NanoBanana />
    </main>
  );
}
