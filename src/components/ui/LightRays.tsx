"use client";

import { useRef, useEffect } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import './LightRays.css';

const DEFAULT_COLOR = '#4a90e2'; // Сделаем временно синим для теста

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [0.3, 0.6, 1.0];
};

const getAnchorAndDir = (origin: string, w: number, h: number) => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left':
      return { anchor: [0, 0], dir: [1, 1] }; // Упростим направление для теста
    case 'top-right':
      return { anchor: [w, 0], dir: [-1, 1] };
    default:
      return { anchor: [w * 0.5, 0], dir: [0, 1] };
  }
};

interface LightRaysProps {
  raysOrigin?: string;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
}

const LightRays = ({
  raysOrigin = 'top-left',
  raysColor = DEFAULT_COLOR,
  raysSpeed = 1,
  lightSpread = 0.7,
  rayLength = 1.5,
  pulsating = true,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.01,
  distortion = 0.1,
  className = ''
}: LightRaysProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      premultipliedAlpha: false
    });
    rendererRef.current = renderer;
    const gl = renderer.gl;

    containerRef.current.appendChild(gl.canvas);

    const vert = `
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = position * 0.5 + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const frag = `
      precision highp float;
      uniform float iTime;
      uniform vec2 iResolution;
      uniform vec2 rayPos;
      uniform vec2 rayDir;
      uniform vec3 raysColor;
      
      varying vec2 vUv;

      void main() {
        vec2 coord = gl_FragCoord.xy;
        vec2 sourceToCoord = coord - rayPos;
        float dist = length(sourceToCoord);
        
        vec2 dirNorm = normalize(sourceToCoord);
        float cosAngle = dot(dirNorm, normalize(rayDir));
        
        float strength = pow(max(cosAngle, 0.0), 10.0); // Сделаем лучи острее
        strength *= (1.0 - dist / (iResolution.x * 1.5));
        
        float noise = sin(cosAngle * 50.0 + iTime * 2.0) * 0.1 + 0.9;
        
        gl_FragColor = vec4(raysColor, strength * noise * 0.8);
      }
    `;

    const { anchor, dir } = getAnchorAndDir(raysOrigin, gl.canvas.width, gl.canvas.height);
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: [gl.canvas.width, gl.canvas.height] },
      rayPos: { value: anchor },
      rayDir: { value: dir },
      raysColor: { value: hexToRgb(raysColor) }
    };

    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms,
      transparent: true,
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      renderer.setSize(w, h);
      uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height];
      const placement = getAnchorAndDir(raysOrigin, gl.canvas.width, gl.canvas.height);
      uniforms.rayPos.value = placement.anchor;
      uniforms.rayDir.value = placement.dir;
    };

    window.addEventListener('resize', updateSize);
    updateSize();

    const loop = (t: number) => {
      uniforms.iTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      animationIdRef.current = requestAnimationFrame(loop);
    };
    animationIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
    };
  }, [raysColor, raysOrigin]);

  return <div ref={containerRef} className={`light-rays-container ${className}`.trim()} />;
};

export default LightRays;
