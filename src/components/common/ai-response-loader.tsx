"use client"

import { useEffect, useState } from "react"

export default function AIResponseLoader() {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 300)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl text-base">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            AI
          </div>
          <div className="flex-1">
            <div className="text-left bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "600ms" }}
                  />
                </div>
                <span className="text-gray-500">AI is thinking{dots}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
