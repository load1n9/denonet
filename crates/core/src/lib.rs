#[cfg(not(feature = "cuda"))]
mod cpu;
#[cfg(feature = "cuda")]
mod gpu;
#[cfg(not(target_arch = "wasm32"))]
mod ffi;
mod tensor;
mod types;
mod util;
#[cfg(target_arch = "wasm32")]
mod wasm;

#[cfg(not(feature = "cuda"))]
pub use cpu::*;

#[cfg(feature = "cuda")]
pub use gpu::*;

#[cfg(not(target_arch = "wasm32"))]
pub use ffi::*;
pub use tensor::*;
pub use types::*;
pub use util::*;

#[cfg(target_arch = "wasm32")]
pub use wasm::*;

use std::cell::RefCell;

pub struct Resources {
    pub backend: RefCell<Vec<Backend>>,
}

impl Resources {
    pub fn new() -> Self {
        Self {
            backend: RefCell::new(Vec::new()),
        }
    }
}

thread_local! {
    pub static RESOURCES: Resources = Resources::new();
}
