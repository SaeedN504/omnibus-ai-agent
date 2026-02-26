'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

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
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Omnibus AI Agent</h1>
      
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-4 bg-gray-800 rounded mb-4 text-white"
          rows={4}
          placeholder="Enter your message..."
        />
        <button 
          type="submit"
          className="px-6 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </form>

      {response && (
        <div className="mt-8 p-4 bg-gray-800 rounded max-w-2xl">
          <h2 className="font-bold mb-2">Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </main>
  );
}