'use client'

import { useState } from "react"
import Link from "next/link"

export default function Home() {
  const [name, setName] = useState("Guest")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fff] text-neutral-900 dark:text-slate-50">
      <h1 className="text-4xl font-bold">Sign Connect</h1>
      <p className="text-xl">Hello, {name}!</p>

      <button onClick={() => setName("Alice")} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Set My Name
      </button>

      <Link href="/contacts" className="text-lg text-blue-600 dark:text-blue-400">
        Open Contacts
      </Link>
    </main>
  )
}
