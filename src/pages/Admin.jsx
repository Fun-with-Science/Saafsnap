import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, Trash2, RotateCcw, FileText, Hourglass, Users, Camera, Sparkles, CheckCheck } from 'lucide-react'
import { useStore } from '../lib/store'
import { DEPARTMENTS } from '../lib/departments'
import { priority, timeAgo } from '../lib/priority'
import { UserAvatar } from '../components/Stickers'
import { StatTile, LevelChip, EmptyState, Modal } from '../components/ui'

const ROLE = { citizen: 'Citizen', ngo: 'NGO', govt: 'Government', group: 'Group', admin: 'Admin' }
const TABS = [
  { id: 'verify', label: 'Verifications' },
  { id: 'users', label: 'Users' },
  { id: 'reports', label: 'Reports' },
]

export default function Admin() {
  const { users, reports, setUserStatus, removeReport, resetDemo, userById, dataMode } = useStore()
  const shared = dataMode === 'supabase'
  const navigate = useNavigate()
  const [tab, setTab] = useState('verify')
  const [roleFilter, setRoleFilter] = useState('all')
  const [confirm, setConfirm] = useState(null)

  const pending = users.filter((u) => u.status === 'pending')
  const shownUsers = useMemo(() => users.filter((u) => roleFilter === 'all' || u.role === roleFilter), [users, roleFilter])

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold md:text-4xl">Admin panel</h1>
          <p className="font-semibold text-ink/55">Verify organisations and keep the feed honest.</p>
        </div>
        {!shared && (
          <button className="btn btn-white btn-sm" onClick={() => setConfirm({ kind: 'reset' })}>
            <RotateCcw size={16} /> Reset demo data
          </button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Hourglass} label="Pending verification" value={pending.length} color="sun" />
        <StatTile icon={Users} label="Users" value={users.length} color="sky" delay={0.05} />
        <StatTile icon={Camera} label="Reports" value={reports.length} color="grape" delay={0.1} />
        <StatTile icon={Sparkles} label="Cleaned" value={reports.filter((r) => r.status === 'cleaned').length} color="leaf" delay={0.15} />
      </div>

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`relative rounded-full border-2 px-4 py-2 text-sm font-extrabold ${tab === t.id ? 'border-ink text-white' : 'border-ink/10 bg-white text-ink/60'}`}>
            {tab === t.id && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative">
              {t.label}
              {t.id === 'verify' && pending.length > 0 && <span className="ml-1.5 rounded-full bg-coral-500 px-1.5 text-xs text-white">{pending.length}</span>}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'verify' &&
          (pending.length === 0 ? (
            <EmptyState icon={CheckCheck} color="leaf" title="All caught up" text="No organisations are waiting for verification." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence>
                {pending.map((u) => (
                  <motion.div key={u.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="card p-5">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} size={48} />
                      <div className="min-w-0">
                        <div className="truncate font-display text-xl font-extrabold">{u.org?.name || u.name}</div>
                        <div className="text-sm font-bold text-ink/50">{ROLE[u.role]} · signed up {timeAgo(u.createdAt)}</div>
                      </div>
                    </div>
                    <dl className="mt-4 space-y-1.5 text-sm">
                      <Field k="Contact" v={`${u.name} · ${u.email}`} />
                      <Field k={u.role === 'govt' ? 'Employee ID' : 'Registration'} v={u.org?.regId} />
                      {u.role === 'govt' && <Field k="Department" v={DEPARTMENTS[u.org.department]?.name} />}
                      <Field k="City" v={u.org?.city} />
                      <Field k="Proof" v={u.org?.proof ? <span className="inline-flex items-center gap-1"><FileText size={14} /> {u.org.proof}</span> : 'Not attached'} />
                    </dl>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button className="btn btn-white btn-sm" onClick={() => setUserStatus(u.id, 'rejected')}><X size={16} /> Reject</button>
                      <button className="btn btn-primary btn-sm" onClick={() => setUserStatus(u.id, 'active')}><Check size={16} /> Approve</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ))}

        {tab === 'users' && (
          <div>
            <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
              {['all', 'citizen', 'ngo', 'govt', 'group', 'admin'].map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)} className={`shrink-0 rounded-full border-2 px-3 py-1 text-xs font-extrabold ${roleFilter === r ? 'border-ink bg-ink text-white' : 'border-ink/10 bg-white'}`}>
                  {r === 'all' ? 'All' : ROLE[r]}
                </button>
              ))}
            </div>
            <div className="card divide-y-2 divide-ink/5 overflow-hidden">
              {shownUsers.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center gap-3 p-3">
                  <UserAvatar user={u} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{u.org?.name || u.name}</div>
                    <div className="truncate text-xs font-bold text-ink/50">{ROLE[u.role]} · {u.email}</div>
                  </div>
                  <span className={`chip ${u.status === 'active' ? 'bg-leaf-100 text-leaf-700' : u.status === 'pending' ? 'bg-sun-100 text-amber-700' : 'bg-coral-100 text-coral-600'}`}>{u.status}</span>
                  {u.role !== 'admin' && u.role !== 'citizen' && (
                    u.status === 'active'
                      ? <button className="btn btn-white btn-sm !py-1 !text-sm" onClick={() => setUserStatus(u.id, 'rejected')}>Revoke</button>
                      : <button className="btn btn-primary btn-sm !py-1 !text-sm" onClick={() => setUserStatus(u.id, 'active')}>Approve</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="card divide-y-2 divide-ink/5 overflow-hidden">
            {[...reports].sort((a, b) => b.createdAt - a.createdAt).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3">
                <img src={r.photo} alt="" className="h-14 w-14 shrink-0 rounded-xl border-2 border-ink object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/r/${r.id}`} className="block truncate font-extrabold hover:text-leaf-600">{r.ai.title}</Link>
                  <div className="truncate text-xs font-bold text-ink/50">
                    by {userById(r.createdBy)?.name} · {timeAgo(r.createdAt)} · {DEPARTMENTS[r.department].name}
                    {r.ai.user_override && <span className="text-coral-600"> · AI said not garbage</span>}
                  </div>
                </div>
                <LevelChip level={priority(r).level} className="hidden sm:inline-flex" />
                <button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-coral-600 hover:bg-coral-100" title="Remove report" aria-label="Remove report" onClick={() => setConfirm({ kind: 'remove', report: r })}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!confirm} onClose={() => setConfirm(null)}>
        {confirm?.kind === 'remove' && (
          <>
            <h2 className="pr-8 text-2xl font-extrabold">Remove this report?</h2>
            <p className="mt-2 font-semibold text-ink/60">"{confirm.report.ai.title}" will disappear from the feed and map for everyone. This can't be undone.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="btn btn-white" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-coral" onClick={() => { removeReport(confirm.report.id); setConfirm(null) }}>Remove</button>
            </div>
          </>
        )}
        {confirm?.kind === 'reset' && (
          <>
            <h2 className="pr-8 text-2xl font-extrabold">Reset all demo data?</h2>
            <p className="mt-2 font-semibold text-ink/60">
              Every account and report created on this device will be deleted and the original demo data restored. You'll be logged out.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="btn btn-white" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn btn-coral" onClick={async () => {
                setConfirm(null)
                await resetDemo()
                navigate('/')
              }}>Reset</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

function Field({ k, v }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 font-extrabold text-ink/45">{k}</dt>
      <dd className="min-w-0 break-words font-bold">{v || '—'}</dd>
    </div>
  )
}
