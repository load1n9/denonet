import type { DataTypeArray } from "../../deps.ts";
import type {
  Backend,
  Cost,
  CPULayer,
  DataSet,
  NetworkConfig,
  NetworkJSON,
  Size,
} from "../../core/types.ts";
import { iterate1D } from "../../core/util.ts";
import { CPUCostFunction, CrossEntropy, Hinge } from "./cost.ts";
import { ConvCPULayer } from "./layers/conv.ts";
import { DenseCPULayer } from "./layers/dense.ts";
import { PoolCPULayer } from "./layers/pool.ts";
import { CPUMatrix } from "./matrix.ts";

type OutputLayer = DenseCPULayer;

export class CPUBackend implements Backend {
  input?: Size;
  layers: CPULayer[] = [];
  output: OutputLayer;
  silent: boolean;
  costFn: CPUCostFunction = new CrossEntropy();

  constructor(config: NetworkConfig) {
    this.input = config.input;
    this.silent = config.silent ?? false;
    config.layers.map(this.addLayer.bind(this));
    this.output = config.layers[config.layers.length - 1];
    this.setCost(config.cost);
  }

  static load() {
  }

  setCost(activation: Cost): void {
    switch (activation) {
      case "crossentropy":
        this.costFn = new CrossEntropy();
        break;
      case "hinge":
        this.costFn = new Hinge();
        break;
    }
  }

  // deno-lint-ignore no-explicit-any
  addLayer(layer: any): void {
    this.layers.push(layer);
  }

  initialize(inputSize: Size, batches: number) {
    this.layers[0]?.initialize(inputSize, batches);

    for (let i = 1; i < this.layers.length; i++) {
      const current = this.layers[i];
      const previous = this.layers[i - 1];
      current.initialize(previous?.outputSize || inputSize, batches);
    }
  }

  feedForward(input: CPUMatrix): CPUMatrix {
    for (const layer of this.layers) {
      input = layer.feedForward(input);
    }
    return input;
  }

  backpropagate(output: DataTypeArray, rate: number) {
    const { x, y } = this.output.output;
    let error = CPUMatrix.with(x, y);
    for (const i in this.output.output.data) {
      error.data[i] = this.costFn.prime(
        output[i],
        this.output.output.data[i],
      );
    }
    this.output.backPropagate(error, rate);
    for (let i = this.layers.length - 2; i >= 0; i--) {
      error = (this.layers[i + 1] as DenseCPULayer).getError()
      this.layers[i].backPropagate(error, rate);
    }
  }

  train(
    datasets: DataSet[],
    epochs = 5000,
    batches = 1,
    rate = 0.1,
  ): void {
    batches = datasets[0].inputs.y || batches;
    const inputSize = datasets[0].inputs.x || this.input;

    this.initialize(inputSize, batches);

    iterate1D(epochs, (e: number) => {
      if (!this.silent) console.log(`Epoch ${e + 1}/${epochs}`);
      for (const dataset of datasets) {
        this.feedForward(dataset.inputs);
        this.backpropagate(dataset.outputs as DataTypeArray, rate);
      }
    });
  }

  // getCostLoss(output: DataTypeArray) {
  //   const { x, y } = this.output.output;
  //   const cost = CPUMatrix.with(x, y);
  //   for (const i in this.output.output.data) {
  //     const activation = this.output.activationFn.prime(
  //       this.output.output.data[i],
  //     );
  //     cost.data[i] = activation * this.costFn.prime(
  //       output[i],
  //       this.output.output.data[i],
  //     );
  //   }
  //   return cost;
  // }

  predict(data: DataTypeArray) {
    const input = new CPUMatrix(data, data.length, 1);
    for (const layer of this.layers) {
      layer.reset(1);
    }
    return this.feedForward(input).data;
  }

  toJSON(): NetworkJSON {
    return {
      costFn: this.costFn.name,
      type: "NeuralNetwork",
      sizes: this.layers.map((layer) => layer.outputSize),
      input: this.input,
      layers: this.layers.map((layer) => layer.toJSON()),
      output: this.output.toJSON(),
    };
  }

  static fromJSON(data: NetworkJSON): CPUBackend {
    const layers = data.layers.map((layer) => {
      switch (layer.type) {
        case "dense":
          return DenseCPULayer.fromJSON(layer);
        case "conv":
          return ConvCPULayer.fromJSON(layer);
        case "pool":
          return PoolCPULayer.fromJSON(layer);
        default:
          throw new Error(
            `${
              layer.type.charAt(0).toUpperCase() + layer.type.slice(1)
            }Layer not implemented for the CPU backend`,
          );
      }
    });
    layers.push(DenseCPULayer.fromJSON(data.output));
    const backend = new CPUBackend({
      input: data.input,
      layers,
      cost: data.costFn! as Cost,
    });
    return backend;
  }

  save(_str: string): void {
    throw new Error("Not implemented");
  }

  getWeights(): CPUMatrix[] {
    return this.layers.map((layer) => (layer as DenseCPULayer).weights);
  }

  getBiases(): CPUMatrix[] {
    return this.layers.map((layer) => (layer as DenseCPULayer).biases);
  }
}
