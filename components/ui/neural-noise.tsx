'use client';

import { useEffect, useRef } from 'react';

export function NeuralNoise({ color = [0.9, 0.2, 0.4], opacity = 0.95, speed = 0.001 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform vec2 mouse;
      
      float neuro_shape(vec2 p, float t) {
        vec2 r = vec2(1.0);
        float d = 0.0;
        for(float i = 1.0; i < 8.0; i++) {
          r = vec2(
            sin(p.x * i + t * 0.5) * cos(p.y * i + t * 0.3),
            cos(p.x * i * 0.7 - t * 0.4) * sin(p.y * i * 0.8 + t * 0.2)
          );
          d += length(r) * 0.5;
        }
        return d;
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;
        vec2 mousePos = mouse * 2.0 - 1.0;
        mousePos.x *= resolution.x / resolution.y;
        float mouseDist = length(p - mousePos);
        float mouseInfluence = smoothstep(1.5, 0.0, mouseDist) * 0.3;
        float t = time * 0.3;
        float n = neuro_shape(p + mousePos * mouseInfluence, t);
        vec3 color1 = vec3(0.98, 0.45, 0.52);
        vec3 color2 = vec3(0.88, 0.11, 0.28);
        vec3 finalColor = mix(color2, color1, n * 0.5 + 0.5);
        finalColor *= 0.15;
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function compileShader(source: string, type: number): WebGLShader | null {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const timeLocation = gl.getUniformLocation(program, 'time');
    const mouseLocation = gl.getUniformLocation(program, 'mouse');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: 0.5, y: 0.5 };
    function handleMouseMove(e: MouseEvent) {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1.0 - e.clientY / window.innerHeight;
    }
    window.addEventListener('mousemove', handleMouseMove);

    let startTime = Date.now();
    let animationId: number;
    
    function render() {
      const time = (Date.now() - startTime) / 1000;
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(mouseLocation, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    }
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity,
      }}
    />
  );
}