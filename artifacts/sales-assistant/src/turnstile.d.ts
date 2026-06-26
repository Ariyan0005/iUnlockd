interface TurnstileInstance {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
}
interface Window {
  turnstile?: TurnstileInstance;
}
