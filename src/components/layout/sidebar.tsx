'use client'

import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart,
  Package, ScanLine, Wallet,
  Users, BookOpen, Shield, AlertTriangle,
  LogOut, ChevronDown, ChevronRight,
  Truck, X, Menu, MessageSquarePlus, GitMerge, Sparkles, Bot
} from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'

// ─── Types ─────────────────────────────────────────────
interface NavChild {
  href: string
  label: string
  roles?: string[]
}

interface NavGroup {
  type: 'group'
  href: string          // landing URL (default tab)
  label: string
  icon: React.ElementType
  roles?: string[]      // akses level grup
  children: NavChild[]
}

interface NavLink {
  type?: 'link'
  href: string
  label: string
  icon: React.ElementType
  roles?: string[]
}

interface NavSection {
  title: string | null
  items: (NavLink | NavGroup)[]
}

// Tab default per halaman bertab — dipakai untuk active-state saat URL tanpa ?tab=
const DEFAULT_TABS: Record<string, string> = {
  '/inventory': 'overview',
  '/procurement': 'po',
  '/finance': 'wallet',
  '/owner-room': 'Users',
}

const ALL_INTERNAL = ['OWNER', 'FINANCE', 'STAFF']
const OF = ['OWNER', 'FINANCE']

// ─── Struktur navigasi (grouping per fungsi bisnis) ────
const NAV_SECTIONS: NavSection[] = [
  {
    title: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_INTERNAL },
    ],
  },
  {
    title: 'Penjualan',
    items: [
      { href: '/orders', label: 'Pesanan', icon: ShoppingCart, roles: ALL_INTERNAL },
      { href: '/scan-order', label: 'Scan Resi', icon: ScanLine, roles: ALL_INTERNAL },
      { href: '/produk-gabungan', label: 'Produk Gabungan', icon: GitMerge, roles: OF },
      { href: '/crm', label: 'CRM', icon: Users, roles: OF },
    ],
  },
  {
    title: 'Operasional',
    items: [
      {
        type: 'group',
        href: '/inventory',
        label: 'Inventori',
        icon: Package,
        roles: ALL_INTERNAL,
        children: [
          { href: '/inventory?tab=overview', label: 'Stok Overview', roles: ALL_INTERNAL },
          { href: '/inventory?tab=scan', label: 'Scan Masuk/Keluar', roles: ALL_INTERNAL },
          { href: '/inventory?tab=ledger', label: 'Inventory Ledger', roles: ALL_INTERNAL },
          { href: '/inventory?tab=opname', label: 'Stock Opname', roles: OF },
          { href: '/inventory?tab=master', label: 'Master Produk', roles: OF },
        ],
      },
      {
        type: 'group',
        href: '/procurement',
        label: 'Procurement',
        icon: Truck,
        roles: OF,
        children: [
          { href: '/procurement?tab=po', label: 'Purchase Orders', roles: OF },
          { href: '/procurement?tab=tracking', label: 'Tracking Produk PO', roles: OF },
          { href: '/procurement?tab=vendor', label: 'Vendor', roles: OF },
          { href: '/procurement?tab=payment', label: 'Pembayaran Vendor', roles: OF },
          { href: '/procurement?tab=monitor', label: 'Monitoring', roles: OF },
        ],
      },
      { href: '/alerts', label: 'Alerts', icon: AlertTriangle, roles: OF },
    ],
  },
  {
    title: 'Keuangan',
    items: [
      {
        type: 'group',
        href: '/finance',
        label: 'Finance Room',
        icon: Wallet,
        roles: OF,
        children: [
          { href: '/finance?tab=wallet', label: 'Wallet & Ledger', roles: OF },
          { href: '/finance?tab=iklan', label: 'Budget Iklan', roles: OF },
          { href: '/finance?tab=payout', label: 'Payout', roles: OF },
          { href: '/finance?tab=utang', label: 'Utang & Piutang', roles: OF },
          { href: '/finance?tab=aset', label: 'Aset Tetap', roles: OF },
          { href: '/finance?tab=modal', label: 'Modal Awal', roles: ['OWNER'] },
          { href: '/finance?tab=laporan', label: 'Laporan', roles: OF },
          { href: '/finance?tab=tools', label: 'Tools Finance', roles: OF },
        ],
      },
    ],
  },
  {
    title: 'Monitoring & AI',
    items: [
      { href: '/ai-insights', label: 'AI Insights', icon: Sparkles, roles: ['OWNER'] },
      { href: '/ai-assistant', label: 'AI Assistant', icon: Bot, roles: ALL_INTERNAL },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/owner-room', label: 'Owner Room', icon: Shield, roles: ['OWNER'] },
      { href: '/suggest-revision', label: 'Suggest Revision', icon: MessageSquarePlus, roles: ALL_INTERNAL },
      { href: '/documentation', label: 'Dokumentasi', icon: BookOpen, roles: ALL_INTERNAL },
    ],
  },
]

// ─── Active-state helpers ──────────────────────────────
function isLinkActive(href: string, pathname: string, currentTab: string | null): boolean {
  const [path, query] = href.split('?')

  // Path harus cocok dulu
  if (pathname !== path && !pathname.startsWith(path + '/')) return false

  // Link tanpa query (mis. /orders)
  if (!query) {
    const defaultTab = DEFAULT_TABS[path]
    // Untuk halaman bertab, link bare hanya aktif saat tab default tampil
    if (defaultTab !== undefined) {
      return !currentTab || currentTab === defaultTab
    }
    return true
  }

  // Link dengan ?tab=X — cocokkan param tab (fallback ke tab default saat param kosong)
  const tab = new URLSearchParams(query).get('tab')
  if (currentTab) return currentTab === tab
  return DEFAULT_TABS[path] === tab
}

function useNavState() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  return { pathname, currentTab }
}

// ─── Single link ───────────────────────────────────────
function NavLinkComponent({ item, onNavigate }: { item: NavLink; onNavigate?: () => void }) {
  const { user } = useAuth()
  const { pathname, currentTab } = useNavState()

  if (item.roles && user && !item.roles.includes(user.userRole)) return null

  const isActive = isLinkActive(item.href, pathname, currentTab)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        isActive
          ? 'bg-emerald-900/40 text-emerald-400 font-medium'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

// ─── Collapsible group (deep-link ke tab) ──────────────
function NavGroupComponent({ group, onNavigate }: { group: NavGroup; onNavigate?: () => void }) {
  const { user } = useAuth()
  const router = useRouter()
  const { pathname, currentTab } = useNavState()

  const visibleChildren = group.children.filter(
    c => !c.roles || !user || c.roles.includes(user.userRole)
  )

  const isChildActive = visibleChildren.some(c => isLinkActive(c.href, pathname, currentTab))
  const isOnGroupPage = isLinkActive(group.href, pathname, currentTab) || isChildActive

  const [open, setOpen] = useState(isChildActive)

  // Auto-expand saat navigasi ke salah satu anak
  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [isChildActive])

  // Sembunyikan grup bila role tak punya akses / tak ada anak yang terlihat
  if (group.roles && user && !group.roles.includes(user.userRole)) return null
  if (visibleChildren.length === 0) return null

  const Icon = group.icon

  const handleParentClick = () => {
    setOpen(true)
    router.push(group.href)
    onNavigate?.()
  }

  return (
    <div>
      <div
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer',
          isOnGroupPage
            ? 'bg-emerald-900/30 text-emerald-400'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
        )}
        onClick={handleParentClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleParentClick() }}
      >
        <Icon size={16} className="shrink-0" />
        <span className="flex-1 truncate">{group.label}</span>
        <button
          onClick={e => { e.stopPropagation(); setOpen(!open) }}
          className="p-0.5 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300"
          aria-label={open ? `Tutup menu ${group.label}` : `Buka menu ${group.label}`}
          aria-expanded={open}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-2">
          {visibleChildren.map(child => {
            const active = isLinkActive(child.href, pathname, currentTab)
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors',
                  active
                    ? 'bg-emerald-900/40 text-emerald-400 font-medium'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                )}
              >
                <span className={cn('w-1 h-1 rounded-full shrink-0', active ? 'bg-emerald-400' : 'bg-zinc-700')} />
                <span className="truncate">{child.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar ───────────────────────────────────────────
interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth()

  // Filter section: buang section tanpa item yang terlihat untuk role ini
  const visibleSections = NAV_SECTIONS
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.roles || !user) return true
        if (item.roles.includes(user.userRole)) return true
        // Grup bisa saja masih punya anak yang terlihat walau grup-nya sendiri ter-filter
        if ((item as NavGroup).type === 'group') {
          const g = item as NavGroup
          return g.children.some(c => !c.roles || c.roles.includes(user.userRole))
        }
        return false
      }),
    }))
    .filter(section => section.items.length > 0)

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      {visibleSections.map((section, si) => (
        <div key={section.title ?? 'utama'} className={si > 0 ? 'mt-4' : ''}>
          {section.title && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map(item =>
              (item as NavGroup).type === 'group' ? (
                <NavGroupComponent key={item.href} group={item as NavGroup} onNavigate={onNavigate} />
              ) : (
                <NavLinkComponent key={item.href} item={item as NavLink} onNavigate={onNavigate} />
              )
            )}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-emerald-400">E</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">JYF FOOTWEAR</p>
            <p className="text-[10px] text-zinc-500">Management System</p>
          </div>
        </div>
        {onMobileClose && (
          <button onClick={onMobileClose} className="text-zinc-500 hover:text-zinc-300 lg:hidden" aria-label="Tutup menu">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav — Suspense untuk useSearchParams */}
      <Suspense fallback={<div className="flex-1 p-4 text-xs text-zinc-600">Memuat menu...</div>}>
        <SidebarNav onNavigate={onMobileClose} />
      </Suspense>

      {/* User */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-emerald-900/50 border border-emerald-800 flex items-center justify-center">
            <span className="text-xs font-bold text-emerald-400">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-200 truncate">{user?.fullName || user?.username}</p>
            <p className="text-[10px] text-zinc-500">{user?.userRole}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-zinc-900 border-r border-zinc-800 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="relative w-64 bg-zinc-900 border-r border-zinc-800 h-full z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}

// Mobile header with hamburger
export function MobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
      <button onClick={onMenuOpen} className="text-zinc-400 hover:text-white" aria-label="Buka menu">
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <span className="text-xs font-bold text-emerald-400">E</span>
        </div>
        <span className="text-sm font-semibold text-white">JYF FOOTWEAR</span>
      </div>
    </header>
  )
}
