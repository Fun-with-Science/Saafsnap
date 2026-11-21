import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Camera } from 'lucide-react'
import { useStore } from '../lib/store'
import ReportCard from '../components/ReportCard'
import { EmptyState } from '../components/ui'

const lastActivity = (r) => r.cleanup?.at || r.createdAt

export default function Feed() {
  const { reports } = useStore()
  const list = useMemo(() => [...reports].sort((a, b) => lastActivity(b) - lastActivity(a)), [reports])

  return (
    <div className="mx-auto max-w-xl">
      {list.length === 0 ? (
        <EmptyState
          icon={Camera}
          color="sky"
          title="No reports yet"
          text="Spotted garbage somewhere? Snap it and our AI will do the rest."
          action={<Link to="/snap" className="btn btn-primary">Snap the first spot</Link>}
        />
      ) : (
        <div className="space-y-6">
          {list.map((r, i) => (
            <ReportCard key={r.id} report={r} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
