import * as THREE from 'three';

/**
 * Procedural Canvas Texture Generators
 * Guaranteed 0 external network requests, zero 404s, razor-sharp anisotropy.
 */

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function createWatchDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;

  // Clear background
  ctx.clearRect(0, 0, size, size);

  // Outer Chapter Ring
  ctx.save();
  ctx.strokeStyle = '#c8a86a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.94, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#8d7547';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.82, 0, Math.PI * 2);
  ctx.stroke();

  // Railway Minute Track (60 divisions)
  for (let i = 0; i < 60; i++) {
    const angle = (i * Math.PI * 2) / 60 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const rOuter = center * 0.93;
    const rInner = isHour ? center * 0.85 : center * 0.88;

    const x1 = center + Math.cos(angle) * rInner;
    const y1 = center + Math.sin(angle) * rInner;
    const x2 = center + Math.cos(angle) * rOuter;
    const y2 = center + Math.sin(angle) * rOuter;

    ctx.strokeStyle = isHour ? '#f3e5ab' : '#a89467';
    ctx.lineWidth = isHour ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Roman Numerals
  const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ctx.font = 'bold 36px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fcecc4';

  romanNumerals.forEach((num, idx) => {
    // Leave aperture open for tourbillon cage at 6 o'clock (VI)
    if (idx === 6) return;
    const angle = (idx * Math.PI * 2) / 12 - Math.PI / 2;
    const rNum = center * 0.73;
    const x = center + Math.cos(angle) * rNum;
    const y = center + Math.sin(angle) * rNum;
    ctx.fillText(num, x, y);
  });

  // Haute Horlogerie signature
  ctx.font = '500 22px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = '#c5a772';
  ctx.fillText('CHRONOS', center, center * 0.45);
  ctx.font = '300 13px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('FLYING TOURBILLON 28,800 VPH', center, center * 0.51);

  // Swiss Made at bottom
  ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('SWISS PROTOTYPE', center, center * 0.97);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(maxAnisotropy, 16);
  texture.needsUpdate = true;
  return texture;
}

export function createPerlageTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base metallic surface
  ctx.fillStyle = '#b0b8c2';
  ctx.fillRect(0, 0, size, size);

  // Engine-turned overlapping circular perlage swirls
  const step = 28;
  const radius = 22;

  for (let y = 0; y < size + radius; y += step * 0.85) {
    const rowOffset = (Math.floor(y / (step * 0.85)) % 2) * (step / 2);
    for (let x = 0; x < size + radius; x += step) {
      const px = x + rowOffset;
      const py = y;

      const grad = ctx.createRadialGradient(px - 4, py - 4, 1, px, py, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(0.5, 'rgba(160, 170, 180, 0.25)');
      grad.addColorStop(0.85, 'rgba(90, 100, 110, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createSolarCellTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, size, size);

  // Photovoltaic cell grid lines
  const cellW = size / 4;
  const cellH = size / 4;

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const x = c * cellW;
      const y = r * cellH;

      // Dark blue cell face
      const grad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
      grad.addColorStop(0, '#0d2242');
      grad.addColorStop(1, '#061325');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

      // Fine silver busbars
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 1; i < 6; i++) {
        const fy = y + (cellH * i) / 6;
        ctx.moveTo(x + 4, fy);
        ctx.lineTo(x + cellW - 4, fy);
      }
      ctx.stroke();

      // Main silver conductor
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + cellW / 2, y + 2);
      ctx.lineTo(x + cellW / 2, y + cellH - 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(maxAnisotropy, 8);
  texture.needsUpdate = true;
  return texture;
}

export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, size, size);

  const block = 16;
  for (let y = 0; y < size; y += block) {
    for (let x = 0; x < size; x += block) {
      const isAlt = ((x / block) + (y / block)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#1d222b' : '#0e1014';
      ctx.fillRect(x, y, block, block);

      ctx.strokeStyle = isAlt ? '#2d3340' : '#181b22';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + block, y + block);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.needsUpdate = true;
  return texture;
}
