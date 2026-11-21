import { Component } from 'react'
import { TriangleAlert } from 'lucide-react'

// Contains a crash to the part of the screen that failed, so the rest of the app keeps working.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    if (this.props.small)
      return (
        <div className="card-soft flex items-center gap-3 p-4 text-sm font-bold text-ink/55">
          <TriangleAlert size={18} className="shrink-0 text-amber-500" /> This post couldn't be shown.
        </div>
      )
    return (
      <div className="card-soft mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <TriangleAlert size={32} className="text-amber-500" />
        <div className="font-display text-xl font-extrabold">Something went wrong on this page</div>
        <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }
}
