import { useState, useEffect } from 'react'

function App() {
  const [apiStatus, setApiStatus] = useState<string>('Checking...')

  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then(res => res.json())
      .then(data => setApiStatus(`✓ API ${data.status}`))
      .catch(() => setApiStatus('✗ API offline'))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 text-center">
            🔒 DocShare
          </h1>
          <p className="text-xl text-gray-600 text-center mb-8">
            Secure Document Sharing System
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">System Status</h2>
              <span className="text-sm text-gray-500">{apiStatus}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 text-indigo-600">Core Features</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ User authentication</li>
                  <li>✓ Document upload</li>
                  <li>✓ Shareable links</li>
                  <li>✓ Time-limited access</li>
                  <li>✓ Password protection</li>
                  <li>✓ Access logs</li>
                </ul>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-3 text-indigo-600">Tech Stack</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>⚛️ React + TypeScript</li>
                  <li>🎨 Tailwind CSS</li>
                  <li>🚀 Node.js + Express</li>
                  <li>🐘 PostgreSQL</li>
                  <li>🐳 Docker</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-600">
            <p>Ready to build incrementally 🚀</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
