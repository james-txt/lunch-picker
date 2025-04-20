"use client"

import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        style: {
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          color: 'black'
        },
        className: 'group toast group-[.toaster]:border-border group-[.toaster]:shadow',
      }}
      {...props}
    />
  )
}

export { Toaster }
