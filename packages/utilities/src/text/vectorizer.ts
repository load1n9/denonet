import { TfEncoder } from "../encoding/termfrequency.ts";
import { DiscreteMapper } from "../mapper/discrete.ts";
import { Matrix } from "../mod.ts";
import { TfIdfTransformer } from "../transformer/tfidf.ts";
import type { DataType } from "../utils/common_types.ts";

export class TextVectorizer {
  mode: "tf" | "tfidf" | "indices";
  mapper: DiscreteMapper<string>;
  encoder?: TfEncoder;
  transformer?: TfIdfTransformer;
  maxLength: number;
  constructor(mode: "tf" | "tfidf" | "indices" = "indices") {
    this.mode = mode;
    this.mapper = new DiscreteMapper();
    this.maxLength = 0;
  }
  get vocabSize(): number {
    return this.mapper.mapping.size;
  }
  fit(document: string | string[]): TextVectorizer {
    this.mapper.fit(
      (Array.isArray(document) ? document.join(" ") : document).split(" ")
    );
    const tokens = Array.isArray(document)
      ? document.map((x) => this.mapper.transform(x.split(" ")))
      : [this.mapper.transform(document.split(" "))];
    this.maxLength = Math.max(
      Math.max(...tokens.map((x) => x.length)),
      this.maxLength
    );
    if (this.mode === "tf" || this.mode === "tfidf") {
      this.encoder = new TfEncoder(this.mapper.mapping.size);
      if (this.mode === "tfidf") {
        this.transformer = new TfIdfTransformer();
        this.transformer.fit(this.encoder.transform(tokens, "f32"));
      }
    }
    return this;
  }
  transform<DT extends DataType>(
    document: string | string[],
    dType: DT
  ): Matrix<DT> {
    if (!this.mapper.mapping.size)
      throw new Error("Text Vectorizer not trained yet. Use .fit() first.");
    const tokens = Array.isArray(document)
      ? document.map((x) => this.mapper.transform(x.split(" ")))
      : [this.mapper.transform(document.split(" "))];
    if (this.mode === "indices") {
      const res = new Matrix(dType, [tokens.length, this.maxLength]);
      for (let i = 0; i < res.nRows; i += 1) {
        res.setRow(i, tokens[i]);
      }
      return res;
    }
    if (!this.encoder)
      throw new Error("Text Vectorizer not trained yet. Use .fit() first.");
    const encoded = this.encoder.transform(tokens, dType);
    if (this.mode === "tf") return encoded;
    else {
      if (!this.transformer)
        throw new Error("Text Vectorizer not trained yet. Use .fit() first.");
      return this.transformer.transform<DT>(encoded);
    }
  }
}
