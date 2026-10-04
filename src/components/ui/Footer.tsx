"use client"

import Link from "next/link"
import { Logo } from "./Logo"

export interface FooterProps {
  className?: string
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={className || undefined}>
      <Logo href="/" />
      <p>Helping campus belongings find their way home.</p>
      <div>
        <Link href="/report-lost">Report lost</Link>
        <Link href="/report-found">Report found</Link>
        <Link href="/admin">Admin portal</Link>
      </div>
      <small>© 2025 CampusFind · Campus Safety verified</small>
    </footer>
  )
}

export default Footer
