import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <h1>Algo salió mal</h1>
          <p>Ocurrió un error inesperado. Intenta recargar la página.</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.href = "/";
            }}
            style={{
              marginTop: "1rem",
              padding: "0.6rem 1.2rem",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Volver al inicio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
