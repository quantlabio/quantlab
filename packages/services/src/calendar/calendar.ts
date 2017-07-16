// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IIterator
} from '@phosphor/algorithm';

import {
  JSONPrimitive, JSONObject
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ISignal
} from '@phosphor/signaling';

import {
  ServerConnection
} from '..';

import {
  DefaultCalendarSession
} from './default';


/**
 * The namespace for ISession statics.
 */
export
namespace CalendarSession {
  /**
   * An interface for a calendar session.
   */
  export
  interface ISession extends IDisposable {
    /**
     * A signal emitted when the session is shut down.
     */
    terminated: ISignal<ISession, void>;

    /**
     * A signal emitted when a message is received from the server.
     */
    messageReceived: ISignal<ISession, IMessage>;

    /**
     * Get the name of the calendar session.
     */
    readonly name: string;

    /**
     * The model associated with the session.
     */
    readonly model: IModel;

    /**
     * The server settings for the session.
     */
    readonly serverSettings: ServerConnection.ISettings;

    /**
     * Test whether the session is ready.
     */
    readonly isReady: boolean;

    /**
     * A promise that fulfills when the session is initially ready.
     */
    readonly ready: Promise<void>;

    /**
     * Send a message to the calendar session.
     */
    send(message: IMessage): void;

    /**
     * Reconnect to the calendar.
     *
     * @returns A promise that resolves when the calendar has reconnected.
     */
    reconnect(): Promise<void>;

    /**
     * Shut down the calendar session.
     */
    shutdown(): Promise<void>;
  }

  /**
   * Test whether the calendar service is available.
   */
  export
  function isAvailable(): boolean {
    return DefaultCalendarSession.isAvailable();
  }

  /**
   * Start a new calendar session.
   *
   * @options - The session options to use.
   *
   * @returns A promise that resolves with the session instance.
   */
  export
  function startNew(options?: IOptions): Promise<ISession> {
    return DefaultCalendarSession.startNew(options);
  }

  /*
   * Connect to a running session.
   *
   * @param name - The name of the target session.
   *
   * @param options - The session options to use.
   *
   * @returns A promise that resolves with the new session instance.
   *
   * #### Notes
   * If the session was already started via `startNew`, the existing
   * session object is used as the fulfillment value.
   *
   * Otherwise, if `options` are given, we resolve the promise after
   * confirming that the session exists on the server.
   *
   * If the session does not exist on the server, the promise is rejected.
   */
  export
  function connectTo(name: string, options?: IOptions): Promise<ISession> {
    return DefaultCalendarSession.connectTo(name, options);
  }

  /**
   * List the running calendar sessions.
   *
   * @param settings - The server settings to use.
   *
   * @returns A promise that resolves with the list of running session models.
   */
  export
  function listRunning(settings?: ServerConnection.ISettings): Promise<IModel[]> {
    return DefaultCalendarSession.listRunning(settings);
  }

  /**
   * Shut down a calendar session by name.
   *
   * @param name - The name of the target session.
   *
   * @param settings - The server settings to use.
   *
   * @returns A promise that resolves when the session is shut down.
   */
  export
  function shutdown(name: string, settings?: ServerConnection.ISettings): Promise<void> {
    return DefaultCalendarSession.shutdown(name, settings);
  }

  /**
   * The options for intializing a calendar session object.
   */
  export
  interface IOptions {
   /**
    * The server settings for the session.
    */
    serverSettings?: ServerConnection.ISettings;
  }

  /**
   * The server model for a calendar session.
   */
  export
  interface IModel extends JSONObject {
    /**
     * The name of the calendar session.
     */
    readonly name: string;
  }

  /**
   * A message from the calendar session.
   */
  export
  interface IMessage {
    /**
     * The type of the message.
     */
    readonly type: MessageType;

    /**
     * The content of the message.
     */
    readonly content?: JSONPrimitive[];
  }

  /**
   * Valid message types for the calendar.
   */
  export
  type MessageType = 'stdout' | 'disconnect' | 'set_size' | 'stdin';

  /**
   * The interface for a calendar manager.
   *
   * #### Notes
   * The manager is responsible for maintaining the state of running
   * calendar sessions.
   */
  export
  interface IManager extends IDisposable {
    /**
     * A signal emitted when the running calendars change.
     */
    runningChanged: ISignal<IManager, IModel[]>;

    /**
     * The server settings for the manager.
     */
    readonly serverSettings: ServerConnection.ISettings;

    /**
     * Test whether the manager is ready.
     */
    readonly isReady: boolean;

    /**
     * A promise that fulfills when the manager is ready.
     */
    readonly ready: Promise<void>;

    /**
     * Whether the calendar service is available.
     */
    isAvailable(): boolean;

    /**
     * Create an iterator over the known running calendars.
     *
     * @returns A new iterator over the running calendars.
     */
    running(): IIterator<IModel>;

    /**
     * Create a new calendar session.
     *
     * @param options - The options used to create the session.
     *
     * @returns A promise that resolves with the calendar instance.
     *
     * #### Notes
     * The manager `serverSettings` will be always be used.
     */
    startNew(options?: IOptions): Promise<ISession>;

    /*
     * Connect to a running session.
     *
     * @param name - The name of the target session.
     *
     * @returns A promise that resolves with the new session instance.
     */
    connectTo(name: string): Promise<ISession>;

    /**
     * Shut down a calendar session by name.
     *
     * @param name - The name of the calendar session.
     *
     * @returns A promise that resolves when the session is shut down.
     */
    shutdown(name: string): Promise<void>;

    /**
     * Force a refresh of the running calendar sessions.
     *
     * @returns A promise that with the list of running sessions.
     *
     * #### Notes
     * This is not typically meant to be called by the user, since the
     * manager maintains its own internal state.
     */
    refreshRunning(): Promise<void>;
  }
}
