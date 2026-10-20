import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';

export const displayFont = localFont({
  src: '../../fonts/helsinkixxl-black.otf',
  weight: '900',
  style: 'normal',
  display: 'swap',
});

export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
});
