import { action, observable } from 'mobx';
import { Disposer, Disposable } from 'mobx-disposer-util';

import { MobxSocketModelConfig } from './model.types';

export class MobxSocketModel<
  Payload = void,
  InputMessageType = any,
  OutputMessageType = any,
> implements Disposable
{
  private disposer = new Disposer();
  private instance: WebSocket | null = null;

  @observable
  accessor isOpen = false;

  @observable.ref
  accessor message: InputMessageType | null = null;

  @observable
  accessor isReconnectEnabled = false;

  protected serializeOutputMessage: (
    message: OutputMessageType,
  ) => Parameters<WebSocket['send']>[0];
  protected deserializeInputMessage: (message: any) => InputMessageType;

  private notSentMessages: OutputMessageType[] = [];

  private skipReconnectCodes: number[];
  private defaultCloseCode: number;
  private reconnectTimeout: number;
  private payload?: Payload;

  constructor(
    private config: MobxSocketModelConfig<
      Payload,
      InputMessageType,
      OutputMessageType
    >,
  ) {
    this.serializeOutputMessage =
      this.config.serializeOutputMessage ||
      ((message) => JSON.stringify(message));
    this.deserializeInputMessage =
      this.config.deserializeInputMessage || ((message) => JSON.parse(message));

    this.defaultCloseCode = this.config.defaultCloseCode ?? 1000;
    this.isReconnectEnabled = !!this.config.reconnect?.enabled;
    this.skipReconnectCodes = this.config.reconnect?.skipCodes ?? [1001, 1005];
    this.reconnectTimeout = this.config.reconnect?.timeout ?? 1000;
  }

  resendNotSentMessages = () => {
    this.notSentMessages.forEach(this.send);
    this.notSentMessages.length = 0;
  };

  send = (message: OutputMessageType) => {
    if (this.isOpen) {
      this.instance!.send(this.serializeOutputMessage(message));
    } else {
      this.notSentMessages.push(message);
    }
  };

  open = (
    ...args: Payload extends void ? [payload?: Payload] : [payload: Payload]
  ) => {
    this.payload = args[0];

    this.instance = new WebSocket(
      this.getSocketUrl(this.payload!),
      this.config.protocols,
    );
    this.instance.onclose = this.onSocketClose;
    this.instance.onopen = this.onSocketOpen;
    this.instance.onerror = this.onSocketError;
    this.instance.onmessage = this.onSocketMessage;

    this.refreshSocketState();
  };

  protected reconnectTimer?: number;

  protected scheduleReconnect = () => {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnect();
      this.reconnectTimer = undefined;
    }, this.reconnectTimeout);
  };

  protected reconnect = () => {
    if (this.instance) {
      this.instance.onclose = null;
      this.instance.onopen = null;
      this.instance.onerror = null;
      this.instance.onmessage = this.onSocketMessage;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    this.open(this.payload);
  };

  close = (code?: number | null) => {
    this.instance?.close(code ?? this.defaultCloseCode);
  };

  @action.bound
  onSocketMessage = (message: MessageEvent<any>) => {
    try {
      this.message = this.deserializeInputMessage(message.data);
    } catch (e) {
      console.error(
        'failed to parse socket message data:\n',
        message.data,
        '\n',
        'error:',
        e,
      );
    }

    this.refreshSocketState();
  };

  onSocketClose = (event: CloseEvent) => {
    if (this.isReconnectEnabled) {
      if (!this.skipReconnectCodes.includes(event.code)) {
        this.scheduleReconnect();
      }
    }

    this.refreshSocketState();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSocketOpen = (event: Event) => {
    this.refreshSocketState();
  };

  onSocketError = (event: Event) => {
    if (this.isReconnectEnabled) {
      if ('code' in event && event.code === 'ECONNREFUSED') {
        this.scheduleReconnect();
      }
    }

    this.refreshSocketState();
  };

  getSocketUrl = (payload: Payload) => {
    return typeof this.config.url === 'function'
      ? this.config.url(payload)
      : this.config.url;
  };

  @action
  private refreshSocketState = () => {
    this.isOpen =
      !!this.instance && this.instance.readyState === WebSocket.OPEN;

    if (this.isOpen) {
      this.resendNotSentMessages();
    }
  };

  dispose() {
    this.disposer.dispose();
  }
}
