use ndarray::{/*Array, Array2,*/ ArrayD /* , Axis, Ix2*/, IxDyn};
// use std::ops::{Add, AddAssign, Mul};

use crate::FlattenLayer;

pub struct FlattenCPULayer {}

impl FlattenCPULayer {
    pub fn new(_config: FlattenLayer, size: IxDyn) -> Self {
        let _input_size = [size[0], size[1]];

        Self {}
    }

    pub fn reset(&mut self, _batches: usize) {}

    pub fn forward_propagate(&mut self, inputs: ArrayD<f32>) -> ArrayD<f32> {
        inputs
    }

    pub fn backward_propagate(&mut self, d_outputs: ArrayD<f32>, _rate: f32) -> ArrayD<f32> {
        d_outputs
    }
}
