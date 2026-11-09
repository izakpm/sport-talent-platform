import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'PlayVerified — Where performance meets proof';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ShareImage() {
  const logo = await readFile(join(process.cwd(), 'public', 'PlayVerified Logo.png'));
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#102c29', color: '#ffffff', borderBottom: '12px solid #ffc400' }}>
      <img alt="PlayVerified" src={`data:image/png;base64,${logo.toString('base64')}`} width={1012} height={416} />
      <div style={{ display: 'flex', fontSize: 36, marginTop: -35 }}>Where performance meets proof.</div>
      <div style={{ display: 'flex', fontSize: 24, color: '#c4d6c9', marginTop: 28 }}>playverified.app</div>
    </div>,
    size,
  );
}
