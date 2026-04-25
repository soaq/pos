---
name: restaurant-3d-planner
description: Use when designing or implementing a web app for scanning restaurant spaces/equipment into editable 3D layouts, including capture, reconstruction, object isolation, measurement, and floor-plan editing workflows.
---

# Restaurant 3D Planner

Use this skill for product, architecture, or implementation work on a web-based restaurant kitchen scanner/planner.

## Core Principle

Do not treat a full-room Gaussian splat as the editable source of truth. Use scans for visual reference, then create object-level assets with stable transforms, dimensions, labels, and metadata.

## Preferred Architecture

- Capture: mobile web/PWA for guided video/photos; native helper only if device depth/LiDAR access is required.
- Processing: backend job queue for reconstruction, segmentation, mesh extraction, scale validation, and asset generation.
- Viewer/editor: Three.js or Babylon.js scene editor with floor plane, snapping, measurement, collision bounds, and per-equipment transforms.
- Storage: immutable raw captures, processed scene versions, equipment assets, transforms, and audit history.

## Reconstruction Guidance

- Gaussian splatting is good for photorealistic scene review.
- Meshes are better for editable equipment, dimensions, collision, and layout planning.
- For MVP, prefer photogrammetry/depth reconstruction plus manual correction over fully automatic object isolation.
- Require scale anchors or measured references for reliable kitchen planning.

## MVP Scope

- Upload guided scan/video.
- Generate navigable 3D scene.
- Manually outline/tag equipment if automatic segmentation is unreliable.
- Convert equipment to movable bounding boxes or simplified mesh assets.
- Provide top-down layout mode with measurements, snapping, and export.

## High-Risk Areas

- Wrong scale can invalidate layouts.
- Occluded equipment backs/sides produce incomplete geometry.
- Automatic segmentation will fail on stainless commercial kitchens without correction tools.
- Browser-only scanning may not expose enough depth sensor capability consistently across iOS and Android browsers.
