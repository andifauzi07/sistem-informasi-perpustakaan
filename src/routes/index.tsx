import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => (
    <main className="p-4">
      <h1 className="text-xl font-semibold">SIP SMKN 1 Selayar</h1>
    </main>
  ),
})
