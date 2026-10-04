"use client"

import Link from "next/link"
import { Icon } from "./Icon"

export interface LogoProps {
  href?: string
  onClick?: () => void
  className?: string
}

export function Logo({ href = "/", onClick, className = "" }: LogoProps) {
  if (onClick) {
    return (
      <button
        type="button"
        className={`logo ${className}`.trim()}
        onClick={onClick}
        aria-label="CampusFind home"
      >
        <span className="logo-mark">
          <Icon name="location" size={18} />
        </span>
        <span>
          campus<strong>find</strong>
        </span>
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={`logo ${className}`.trim()}
      aria-label="CampusFind home"
    >
      <span className="logo-mark">
        <Icon name="location" size={18} />
      </span>
      <span>
        campus<strong>find</strong>
      </span>
    </Link>
  )
}

export default Logo
