import { Disposable } from 'disposer-util';
import { LinkedAbortController } from 'linked-abort-controller';
import { action, makeObservable, observable } from 'mobx';

import { SocketConfig } from './model.types';

export class Socket<
  Payload = void,
  InputMessageType = any,
  OutputMessageType = any,
> implements Disposable
{
  private abortController: AbortController;
  private instance: WebSocket | null = null;

  isOpen = false;

  message: InputMessageType | null = null;

  isReconnectEnabled = false;

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
    private config: SocketConfig<Payload, InputMessageType, OutputMessageType>,
  ) {
    this.abortController = new LinkedAbortController(config.abortSignal);

    // eslint-disable-next-line sonarjs/deprecation
    if (config.disposer) {
      // eslint-disable-next-line sonarjs/deprecation
      config.disposer.add(() => {
        this.abortController.abort();
      });
    }

    this.serializeOutputMessage =
      this.config.serializeOutputMessage ||
      ((message) => JSON.stringify(message));
    this.deserializeInputMessage =
      this.config.deserializeInputMessage || ((message) => JSON.parse(message));

    this.defaultCloseCode = this.config.defaultCloseCode ?? 1000;
    this.isReconnectEnabled = !!this.config.reconnect?.enabled;
    this.skipReconnectCodes = this.config.reconnect?.skipCodes ?? [1001, 1005];
    this.reconnectTimeout = this.config.reconnect?.timeout ?? 1000;

    observable.ref(this, 'isOpen');
    observable.ref(this, 'message');
    observable.ref(this, 'isReconnectEnabled');
    action(this, 'onSocketMessage');
    action(this, 'refreshSocketState');

    makeObservable(this);
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
    ...arguments_: Payload extends void
      ? [payload?: Payload]
      : [payload: Payload]
  ) => {
    this.payload = arguments_[0];

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
    if (this.reconnectTimer != undefined) {
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

  onSocketMessage = (message: MessageEvent<any>) => {
    try {
      this.message = this.deserializeInputMessage(message.data);
    } catch (error) {
      console.error(
        'failed to parse socket message data:\n',
        message.data,
        '\n',
        'error:',
        error,
      );
    }

    this.refreshSocketState();
  };

  onSocketClose = (event: CloseEvent) => {
    if (
      this.isReconnectEnabled &&
      !this.skipReconnectCodes.includes(event.code)
    ) {
      this.scheduleReconnect();
    }

    this.refreshSocketState();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSocketOpen = (event: Event) => {
    this.refreshSocketState();
  };

  onSocketError = (event: Event) => {
    if (
      this.isReconnectEnabled &&
      'code' in event &&
      event.code === 'ECONNREFUSED'
    ) {
      this.scheduleReconnect();
    }

    this.refreshSocketState();
  };

  getSocketUrl = (payload: Payload) => {
    return typeof this.config.url === 'function'
      ? this.config.url(payload)
      : this.config.url;
  };

  private refreshSocketState = () => {
    this.isOpen =
      !!this.instance && this.instance.readyState === WebSocket.OPEN;

    if (this.isOpen) {
      this.resendNotSentMessages();
    }
  };

  dispose() {
    this.abortController.abort();
  }
}
