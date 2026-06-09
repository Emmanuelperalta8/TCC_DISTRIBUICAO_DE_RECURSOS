import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(error) {
    return { erro: error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.erro) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-boundary-icon">⚠</div>
          <div className="error-boundary-title">Algo deu errado neste componente</div>
          <div className="error-boundary-msg">{this.state.erro.message}</div>
          <button
            className="error-boundary-btn"
            onClick={() => this.setState({ erro: null })}
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
