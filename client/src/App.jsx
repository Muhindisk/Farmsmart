import React, { useState } from 'react'

// Use the build-time value if provided, otherwise use same-origin (empty string)
// This avoids defaulting to localhost when the frontend is deployed (which causes "failed to fetch").
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function App() {
  const [form, setForm] = useState({ name: '', location: '', soil_type: '', soil_ph: '', rainfall_mm: '', crop: '', user_query: '' })
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)
    try {
      const r = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error || 'Server error')
      setResponse(json.ai_response)
    } catch (err) {
      setResponse('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>FarmSmart — Sustainable Farming Assistant</h1>
        <p>Ask for simple, practical advice about your crops and soil.</p>
      </header>

      <main>
        <form onSubmit={submit} className="card">
          <label>Name
            <input name="name" value={form.name} onChange={handleChange} placeholder="Farmer Joe" />
          </label>

          <label>Location
            <input name="location" value={form.location} onChange={handleChange} placeholder="County, Region" />
          </label>

          <label>Soil type
            <input name="soil_type" value={form.soil_type} onChange={handleChange} placeholder="loamy / clay / sandy" />
          </label>

          <label>Soil pH
            <input name="soil_ph" value={form.soil_ph} onChange={handleChange} placeholder="6.2" />
          </label>

          <label>Recent rainfall (mm last 30 days)
            <input name="rainfall_mm" value={form.rainfall_mm} onChange={handleChange} placeholder="50" />
          </label>

          <label>Crop / focus
            <input name="crop" value={form.crop} onChange={handleChange} placeholder="Maize / Beans / Pasture" />
          </label>

          <label>Question for advisor
            <textarea name="user_query" value={form.user_query} onChange={handleChange} placeholder="My maize leaves are yellowing — what should I do?" />
          </label>

          <div className="actions">
            <button type="submit" disabled={loading}>{loading ? 'Thinking...' : 'Ask FarmSmart'}</button>
          </div>
        </form>

        <section className="result card">
          <h2>AI Recommendation</h2>
          {response ? <pre style={{whiteSpace:'pre-wrap'}}>{response}</pre> : <p>No response yet. Ask a question!</p>}
        </section>
      </main>

      <footer>
        <small>Built for Land ReGen · Prototype</small>
      </footer>
    </div>
  )
}
