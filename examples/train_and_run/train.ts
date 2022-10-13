import { DenseLayer, NeuralNetwork, Rank, Tensor } from "../../mod.ts";
import { CPU } from "../../backends/cpu/mod.ts";
import { Model } from "../../model/mod.ts";

const net = await new NeuralNetwork({
  silent: true,
  layers: [
    new DenseLayer({ size: 3, activation: "sigmoid" }),
    new DenseLayer({ size: 1, activation: "sigmoid" }),
  ],
  cost: "crossentropy",
}).setupBackend(CPU);

const time = performance.now();

await net.train(
  [
    {
      inputs: new Tensor<Rank.R2>([
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]).flatten(),
      outputs: [0, 1, 1, 0],
    },
  ],
  5000,
  4,
  0.1,
);

console.log(`training time: ${performance.now() - time}ms`);

await Model.save("./examples/train_and_run/network.json", net);
