@"
'use client';

import { useEffect, useRef } from 'react';

export function NeuralNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Store gl in a variable that TypeScript knows is not null
    const glContext = gl;

    const vertexShaderSource = \`
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    \`;

    const fragmentShaderSource = \`
      precision highp float;
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 pointer;

      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= resolution.x / resolution.y;
        
        float t = time * 0.5;
        
        float n = noise(p + t);
        n += noise(p * 2.0 - t) * 0.5;
        n += noise(p * 4.0 + t * 0.5) * 0.25;
        n /= 1.75;
        
        vec2 mouse = pointer / resolution * 2.0 - 1.0;
        mouse.x *= resolution.x / resolution.y;
        float dist = length(p - mouse);
        n += smoothstep(0.5, 0.0, dist) * 0.3;
        
        vec3 color1 = vec3(0.1, 0.0, 0.2);
        vec3 color2 = vec3(0.0, 0.4, 0.8);
        vec3 color3 = vec3(0.8, 0.0, 0.4);
        
        vec3 color = mix(color1, color2, n);
        color = mix(color, color3, noise(p * 3.0 + t) * 0.5);
        
        vec2 grid = abs(fract(p * 4.0 - 0.5) - 0.5) / fwidth(p * 4.0);
        float line = min(grid.x, grid.y);
        color += vec3(0.0, 0.8, 1.0) * (1.0 - min(line, 1.0)) * 0.1;
        
        gl_FragColor = vec4(color, 1.0);
      }
    \`;

    function createShader(type: number, source: string): WebGLShader | null {
      const shader = glContext.createShader(type);
      if (!shader) return null;
      glContext.shaderSource(shader, source);
      glContext.compileShader(shader);
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        console.error(glContext.getShaderInfoLog(shader));
        glContext.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(glContext.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(glContext.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = glContext.createProgram();
    if (!program) return;
    
    glContext.attachShader(program, vertexShader);
    glContext.attachShader(program, fragmentShader);
    glContext.linkProgram(program);

    if (!glContext.getProgramParameter(program, glContext.LINK_STATUS)) {
      console.error(glContext.getProgramInfoLog(program));
      return;
    }

    glContext.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = glContext.createBuffer();
    glContext.bindBuffer(glContext.ARRAY_BUFFER, buffer);
    glContext.bufferData(glContext.ARRAY_BUFFER, vertices, glContext.STATIC_DRAW);

    const position = glContext.getAttribLocation(program, 'position');
    glContext.enableVertexAttribArray(position);
    glContext.vertexAttribPointer(position, 2, glContext.FLOAT, false, 0, 0);

    const timeUniform = glContext.getUniformLocation(program, 'time');
    const resolutionUniform = glContext.getUniformLocation(program, 'resolution');
    const pointerUniform = glContext.getUniformLocation(program, 'pointer');

    let animationId: number;
    let startTime = Date.now();
    const pointer = { x: 0, y: 0 };

    function render() {
      const time = (Date.now() - startTime) * 0.001;
      
      glContext.uniform1f(timeUniform, time);
      glContext.uniform2f(resolutionUniform, canvas.width, canvas.height);
      glContext.uniform2f(pointerUniform, pointer.x, pointer.y);
      
      glContext.drawArrays(glContext.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    }

    function handleResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      glContext.viewport(0, 0, canvas.width, canvas.height);
    }

    function handleMouseMove(e: MouseEvent) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    handleResize();
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      glContext.deleteProgram(program);
      glContext.deleteShader(vertexShader);
      glContext.deleteShader(fragmentShader);
      glContext.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent', zIndex: 0 }}
    />
  );
}
"@ | Set-Content components/ui/neural-noise.tsx -Encoding UTF8

# Verify
Get-Content components/ui/neural-noise.tsx | Select-Object -Skip 70 -First 3