import { IDisposer } from 'disposer-util';

interface SocketReconnectConfig {
  enabled: boolean;
  timeout?: number;
  skipCodes?: number[];
}

export interface SocketConfig<
  Payload = void,
  InputMessageType = any,
  OutputMessageType = any,
> {
  url: string | ((payload: Payload | undefined) => string);
  defaultCloseCode?: number;
  protocols?: string[];
  disposer?: IDisposer;
  parseMessage?: (message: any) => Payload;
  serializeOutputMessage?: (
    message: OutputMessageType,
  ) => Parameters<WebSocket['send']>[0];
  deserializeInputMessage?: (message: any) => InputMessageType;
  reconnect?: SocketReconnectConfig;
}