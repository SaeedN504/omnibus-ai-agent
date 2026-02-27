@"
'use client';

import { useEffect, useRef } from 'react';

export function NeuralNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glContext = canvas.getContext('webgl');
    if (!glContext) {
      console.error('WebGL not supported');
      return;
    }
    
    // Store in a const that TypeScript knows is not null
    const gl = glContext;

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
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const timeUniform = gl.getUniformLocation(program, 'time');
    const resolutionUniform = gl.getUniformLocation(program, 'resolution');
    const pointerUniform = gl.getUniformLocation(program, 'pointer');

    let animationId: number;
    let startTime = Date.now();
    const pointer = { x: 0, y: 0 };

    function render() {
      const time = (Date.now() - startTime) * 0.001;
      
      gl.uniform1f(timeUniform, time);
      gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
      gl.uniform2f(pointerUniform, pointer.x, pointer.y);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    }

    function handleResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
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
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
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
"@ | Set-Content components/ui/neural-no