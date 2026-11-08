import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as images from './notesImages.js';

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

test('image validation rejects executable formats and disguised image files', async () => {
  assert.ok(images?.validateImage, 'Image validation must exist');
  await assert.rejects(images.validateImage(new Blob(['<svg onload="alert(1)"/>'], { type: 'image/svg+xml' })), /PNG|JPEG|WebP|GIF/);
  await assert.rejects(images.validateImage(new Blob(['<script>alert(1)</script>'], { type: 'image/png' })), /match|invalid/i);
});

test('image validation limits size and accepts PNG signature', async () => {
  assert.ok(images?.validateImage, 'Image validation must exist');
  await assert.rejects(images.validateImage(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], { type: 'image/png' })), /10 MB/);
  assert.equal(await images.validateImage(new Blob([png], { type: 'image/png' })), 'png');
});
