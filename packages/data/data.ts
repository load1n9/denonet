import type { Rank, Tensor } from "../core/mod.ts";
import { type CsvLoaderConfig, loadCsv } from "./datasets/csv.ts";
import type { DataLike } from "./types.ts";

export class Data {
  /**
   * Model input data
   */
  inputs: Tensor<Rank>;

  /**
   * Model output data / labels
   */
  outputs: Tensor<Rank>;

  constructor(data: DataLike) {
    this.inputs = data.train_x;
    this.outputs = data.train_y;
  }

  /**
   * Load data from a CSV file or URL containing CSV data.
   */
  static async csv(url: string | URL, config?: CsvLoaderConfig): Promise<Data> {
    return new Data(await loadCsv(url, config));
  }
}
