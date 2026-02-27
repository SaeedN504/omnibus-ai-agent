'use client';

import { useState, useEffect } from 'react';
import { NeuralNoise } from '@/components/ui/neural-noise';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: input }],
          model: 'demo'
        }),
      });
      
      const data = await res.json();
      setResponse(data.content || data.error || 'No response');
    } catch (error) {
      setResponse('Error: ' + (error as Error).message);
    }
  };

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">
      {mounted && <NeuralNoise />}
      
      <div className="relative z-10 p-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Omnibus AI Agent
        </h1>
        
        <form onSubmit={handleSubmit} className="max-w-2xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-4 bg-gray-800/80 backdrop-blur rounded mb-4 text-white border border-gray-700"
            rows={4}
            placeholder="Enter your message..."
          />
          <button 
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Send
          </button>
        </form>

        {response && (
          <div className="mt-8 p-4 bg-gray-800/80 backdrop-blur rounded max-w-2xl border border-gray-700">
            <h2 className="font-bold mb-2 text-blue-400">Response:</h2>
            <p>{response}</p>
          </div>
        )}
      </div>
    </main>
  );
}