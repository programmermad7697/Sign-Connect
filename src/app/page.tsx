// 'use client'

// import { useState } from "react"
import Link from "next/link"

export default function Home() {
  // const [name, setName] = useState("Guest")

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 text-slate-50">
      {/* Background decoration */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12 md:p-16">

        {/* Brand */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold shadow-lg shadow-blue-500/20">
            SC
          </div>
        </div>

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
          Welcome
        </p>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Sign Connect
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          This is a video conferencing platform where you can connect with
          others in real-time. In this platform you can communicate with your
          team members, friends, and family in a seamless and efficient manner
          through sign language.
        </p>

        {/* Feature highlights */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            Real-time communication
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            Video conferencing
          </span>

          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            Sign language friendly
          </span>
        </div>

        {/* <button onClick={() => setName("Alice")} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Set My Name
        </button> */}

        {/* Open Contacts */}
        <div className="mt-10">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/30"
          >
            Open Contacts
            <span className="text-lg">→</span>
          </Link>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Connect with your team, friends, and family.
        </p>
      </div>
    </main>
  )
}
