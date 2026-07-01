import ScrollyCanvas from '@/components/ScrollyCanvas';
import Overlay from '@/components/Overlay';
import NanoBanana from '@/components/NanoBanana';
import About from '@/components/About';
import Experience from '@/components/Experience';
import SkillsSphere from '@/components/SkillsSphere';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] selection:bg-zinc-800 selection:text-white">
      <ScrollyCanvas>
        <Overlay />
      </ScrollyCanvas>
      <About />
      <Experience />
      <SkillsSphere />
      <NanoBanana />
    </main>
  );
}
