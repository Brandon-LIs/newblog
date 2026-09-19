import UPNG from 'upng-js';
import JPEG from 'jpeg-js';
import webpEncWasm from '@jsquash/webp/codec/enc/webp_enc.wasm';
import webpEncFactory from '@jsquash/webp/codec/enc/webp_enc.js';
import {initEmscriptenModule} from '@jsquash/webp/utils.js';

globalThis.importScripts = globalThis.importScripts || (() => {});

let encoder = null;

async function getEncoder() {
  if (encoder) return encoder;
  // wrangler imports .wasm as WebAssembly.Module
  const wasmModule = webpEncWasm instanceof WebAssembly.Module ? webpEncWasm : new WebAssembly.Module(webpEncWasm);
  encoder = initEmscriptenModule(webpEncFactory.default || webpEncFactory, wasmModule);
  return encoder;
}

function decodePng(buf) {
  const png = UPNG.decode(buf);
  const rgba = UPNG.toRGBA8(png);
  return {data: rgba[0], width: png.width, height: png.height};
}

function decodeJpeg(buf) {
  const img = JPEG.decode(buf, {useTArray: true, formatAsRGBA: true});
  return {data: img.data, width: img.width, height: img.height};
}

const WEBP_DEFAULTS = {
  quality: 80, target_size: 0, target_PSNR: 0, method: 4,
  sns_strength: 50, filter_strength: 60, filter_sharpness: 0,
  filter_type: 1, partitions: 0, segments: 4, pass: 1,
  show_compressed: 0, preprocessing: 0, autofilter: 0,
  partition_limit: 0, alpha_compression: 1, alpha_filtering: 1,
  alpha_quality: 100, lossless: 0, exact: 0, image_hint: 0,
  emulate_jpeg_size: 0, thread_level: 0, low_memory: 0,
  near_lossless: 100, use_delta_palette: 0, use_sharp_yuv: 0,
};

export async function encodeToWebp(inputBuffer, ext, quality = 80) {
  let rgba;
  if (ext === 'png') {
    rgba = decodePng(new Uint8Array(inputBuffer));
  } else if (ext === 'jpg' || ext === 'jpeg') {
    rgba = decodeJpeg(inputBuffer);
  } else {
    return null;
  }
  const mod = await getEncoder();
  const opts = {...WEBP_DEFAULTS, quality};
  const result = mod.encode(rgba.data, rgba.width, rgba.height, opts);
  if (!result) return null;
  return new Uint8Array(result.buffer);
}