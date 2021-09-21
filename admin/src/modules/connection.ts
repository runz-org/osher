import { reactive, watch } from 'vue';

const ssr = import.meta.env.SSR;

export type On = (data: Record<string, any>) => void;

export class Module {
  public readonly state = reactive<{
    session_id: string | null,
    heartbeat: number,
    online: boolean,
  }>({ 
    session_id: null,
    heartbeat: 0,
    online: !ssr && window.navigator.onLine,
  });
  protected source: EventSource | null = null;
  protected listeners: Record<string, On> = {};

  constructor() {
    this.open = this.open.bind(this);
    this.close = this.close.bind(this);

    if (!ssr) {
      window.addEventListener('offline', () => this.state.online = false );
      window.addEventListener('online', () => this.state.online = true );
    }
  }

  public open(): void {
    const root = import.meta.env.VITE_API_URL;
    if (ssr || typeof root !== 'string' || this.source) return;
    this.source = new EventSource(root);

    this.source.onmessage = (e: any) => {
      this.state.heartbeat = (this.state.heartbeat + 1) % 2;

      try {
        const parsed = JSON.parse(e.data);

        if (typeof parsed === 'object' && null !== parsed) {
          const {event, data} = parsed;

          if ('connected' === event) {
            this.state.session_id = data.session_id;

          } else if (typeof event === 'string' && Object.keys(this.listeners).includes(event)) {
            this.listeners[event](data);
          }
        }
      } catch (error) {
      }
    }

    this.source.onerror = () => {
      this.close();

      if (this.state.online) {
        setTimeout(this.open, 3000);

      } else {
        const stop = watch(() => this.state.online, online => {
          if (online) {
            this.open();
            stop();
          }
        })
      }
    }

    window.addEventListener('beforeunload', this.close);
  }

  public setListener(event: string, on: On): void {
    this.listeners[event] = on;
  }

  public removeListener(event: string): void {
    if (undefined !== this.listeners[event]) {
      delete this.listeners[event];
    }
  }

  public close(): void {
    if (this.source) {
      window.removeEventListener('beforeunload', this.close);
      this.source.close();
      this.state.session_id = null;
      this.source = null;
    }
  }
}

export default new Module;
