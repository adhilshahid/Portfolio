import ScrollyCanvas from '@/components/ScrollyCanvas';
import Overlay from '@/components/Overlay';
import NanoBanana from '@/components/NanoBanana';
import About from '@/components/About';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] selection:bg-zinc-800 selection:text-white">
      <ScrollyCanvas>
        <Overlay />
      </ScrollyCanvas>
      <About />
      <NanoBanana />
    </main>
  );
}
