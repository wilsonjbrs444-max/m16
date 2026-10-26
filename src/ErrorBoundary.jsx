import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="panel">
        <h1>Une erreur est survenue</h1>
        <p className="msg">{String(this.state.error.message || this.state.error)}</p>
        <button className="btn" onClick={() => location.reload()}>Recharger la page</button>
      </div>
    )
  }
}
