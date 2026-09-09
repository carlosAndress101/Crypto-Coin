import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Qué zona protege, para que el mensaje diga algo útil. */
  area?: string;
}

interface State {
  error: Error | null;
}

/**
 * Frontera de error de render.
 *
 * Antes no había ninguna: cualquier excepción durante el render dejaba la página en
 * blanco sin rastro. Se usa por zona y no solo en la raíz, para que un fallo del
 * gráfico no se lleve por delante la tabla de mercado.
 *
 * Sigue siendo una clase porque React no ofrece equivalente en hooks.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`Render error in ${this.props.area ?? "app"}:`, error, info.componentStack);
  }

  private readonly reset = () => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center"
      >
        <p className="text-md font-semibold text-negative">
          {this.props.area ? `The ${this.props.area} could not be displayed.` : "Something broke."}
        </p>
        <button
          type="button"
          onClick={this.reset}
          className="rounded bg-accent px-4 py-2 font-semibold text-fg-inverse transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    );
  }
}
