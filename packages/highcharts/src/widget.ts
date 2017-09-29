// Copyright (c) QuantLab Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Message
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  IHighChartsModel
} from './model';

import * as $ from 'jquery';
import * as Highcharts from 'highcharts';
import * as Highstock from 'highcharts/highstock';
import * as Highmaps from 'highcharts/highmaps';

//const HIGHCHARTS_CLASS = 'jp-HighCharts';


export
class HighCharts extends Widget {
  /**
   * Construct a new highcharts widget.
   *
   * @param options - The highcharts configuration options.
   */
  constructor(options: HighCharts.IOptions) {
    super();

  }

  /**
   * A signal emitted when the model of the notebook changes.
   */
  get modelChanged(): ISignal<this, void> {
    return this._modelChanged;
  }

  /**
   * A signal emitted when the model content changes.
   *
   * #### Notes
   * This is a convenience signal that follows the current model.
   */
  get modelContentChanged(): ISignal<this, void> {
    return this._modelContentChanged;
  }

  /**
   * The cell factory used by the widget.
   */
  readonly contentFactory: HighCharts.IContentFactory;

  /**
   * The model for the widget.
   */
  get model(): IHighChartsModel {
    return this._model;
  }
  set model(newValue: IHighChartsModel) {
    newValue = newValue || null;
    if (this._model === newValue) {
      return;
    }
    let oldValue = this._model;
    this._model = newValue;

    if (oldValue && oldValue.modelDB.isCollaborative) {
      oldValue.modelDB.connected.then(() => {
        oldValue.modelDB.collaborators.changed.disconnect(
          this._onCollaboratorsChanged, this);
      });
    }
    if (newValue && newValue.modelDB.isCollaborative) {
      newValue.modelDB.connected.then(() => {
        newValue.modelDB.collaborators.changed.connect(
          this._onCollaboratorsChanged, this);
      });
    }
    // Trigger private, protected, and public changes.
    this._onModelChanged(oldValue, newValue);
    this.onModelChanged(oldValue, newValue);
    this._modelChanged.emit(void 0);
  }

  /**
   * Handle a new model.
   *
   * #### Notes
   * This method is called after the model change has been handled
   * internally and before the `modelChanged` signal is emitted.
   * The default implementation is a no-op.
   */
  protected onModelChanged(oldValue: IHighChartsModel, newValue: IHighChartsModel): void {
    // No-op.
  }

  /**
   * Handle changes to the notebook model content.
   *
   * #### Notes
   * The default implementation emits the `modelContentChanged` signal.
   */
  protected onModelContentChanged(model: IHighChartsModel, args: void): void {
    this._modelContentChanged.emit(void 0);
  }

  /**
   * Handle a new model on the widget.
   */
  private _onModelChanged(oldValue: IHighChartsModel, newValue: IHighChartsModel): void {
    if (oldValue) {
      oldValue.contentChanged.disconnect(this.onModelContentChanged, this);
    }

    newValue.contentChanged.connect(this.onModelContentChanged, this);
  }

  /**
   * get highcharts model
   */
  modelJSON(): any{
    return null;
  }

  dispose(): void {
    // Do nothing if already disposed.
    if (this.isDisposed) {
      return;
    }
    this._model = null;
    this._chart.destroy();
    super.dispose();
  }

  /**
   * Handle `'activate-request'` messages.
   */
  protected onActivateRequest(msg: Message): void {
    this.node.tabIndex = -1;
    this.node.focus();
  }

  protected onResize(msg: Widget.ResizeMessage): void {
    if(this._chart != null)
      this._chart.setSize(null, null, false);
  }

  createChart(): void {
    let contextModel = this._model;
    let content:any = {};

    if(contextModel.toString() == ''){
      content.data = [[]];
    } else {
      content = JSON.parse(contextModel.toString());
    }

    content.credits = {
      enabled: false
    };
    content.reflow = false;

    const container:HTMLElement = document.getElementById(this.parent.id).children[1] as HTMLElement;

    if(this._chart != null){
      this._chart.destroy();
    }

    // load data from file
    if(content.source.type == 'file'){

      $.get('/files' + content.source.name, ( file =>{
        switch(content.source.format){
          case('json'):
            content.data = {
              json: file
            };
            break;
          case('csv'):
            content.data = {
              csv: file
            };
            break;
          default:
            break;
        }

        switch(content.category){
          case('chart'):
            this._chart = Highcharts.chart(container, content);
            break;
          case('stock'):
            this._chart = new Highstock.StockChart(container, content);
            break;
          case('map'):
            this._chart = Highmaps.mapChart(container, content);
            break;
          default:
            break;
        }
      }));

    }else{ // load data from chart file itself

      if(content.category == 'chart'){
        this._chart = Highcharts.chart(container, content);
      }
      if(content.category == 'stock'){
        this._chart = new Highstock.StockChart(container, content);
      }
      if(content.category == 'map'){
        //content.mapData = worldGeo;
        this._chart = Highmaps.mapChart(container, content);
      }
    }

  }

  /**
   * Handle an update to the collaborators.
   */
  private _onCollaboratorsChanged(): void {

  }

  private _model: IHighChartsModel = null;
  private _chart: any = null;
  private _modelChanged = new Signal<this, void>(this);
  private _modelContentChanged = new Signal<this, void>(this);
}

export
namespace HighCharts {

  export
  interface IOptions {


  }

  /**
   * A factory for creating HighCharts content.
   *
   */
  export
  interface IContentFactory {

  }

}
