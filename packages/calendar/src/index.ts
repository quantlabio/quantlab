// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IInstanceTracker
} from '@quantlab/apputils';

import {
  Token
} from '@phosphor/coreutils';

import {
  Calendar
} from './widget';

import '../style/index.css';

export * from './widget';

/**
 * A class that tracks editor widgets.
 */
export
interface ICalendarTracker extends IInstanceTracker<Calendar> {}


/* tslint:disable */
/**
 * The calendar tracker token.
 */
export
const ICalendarTracker = new Token<ICalendarTracker>('jupyter.services.calendar-tracker');
/* tslint:enable */
