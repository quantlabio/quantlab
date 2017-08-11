// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ClientSession, IClientSession
} from '@quantlab/apputils';

import {
  IObservableList, ObservableList
} from '@quantlab/coreutils';

import {
  ServiceManager, KernelMessage
} from '@quantlab/services';

import {
  map, toArray
} from '@phosphor/algorithm';

import {
  Message
} from '@phosphor/messaging';

import {
  ISignal, Signal
} from '@phosphor/signaling';
