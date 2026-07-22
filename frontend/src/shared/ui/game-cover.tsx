import { useState } from 'react';

function buildFallback(name: string): string {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || name)}&background=312e81&color=c4b5fd&size=128&bold=true&format=png`;
}

export function GameCover({ name, src, className = '' }: { name: string; src: string; className?: string }) {
  const [url, setUrl] = useState(src);

  return (
    <img
      src={url}
      alt=""
      className={className}
      loading="lazy"
      onError={() => setUrl(buildFallback(name))}
    />
  );
}
