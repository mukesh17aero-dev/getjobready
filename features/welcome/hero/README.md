# Welcome hero

The emerald background, gradients, audience tabs, account controls, audience deep links, explanatory labels and existing film remain in place.

## Artwork and motion

`hero-visual.tsx` composes four generated product-render assets from `public/welcome/glass/`. The corresponding prompts and provenance are recorded in `public/welcome/glass/PROMPTS.md`.

- Students: four instances of one polished glass slab, tinted blue, teal, violet and amber. Native, selectable HTML titles and short explanations sit on the layers. The stack spreads, lights up and rebuilds in a ten-second cycle. The Ascend mark remains on the upper layer.
- Colleges: a detailed transparent glass ribbon with blue, teal and amber refractions. A restrained rotation and two travelling light accents convey the feedback cycle.
- Employers: a clear glass core with the Ascend mark, five independently orbiting glass nodes and a periodic match signal.

These are rendered artwork layers with CSS motion, **not live 3D meshes or physical mesh morphs**. A 900 ms transition gathers the outgoing composition into a shared four-colour twist, then releases the incoming artwork. This runs in both directions and restarts safely on rapid tab changes. Inactive artwork is hidden and its animations pause. Paused and reduced-motion states switch directly to the chosen composition. This replaces the procedural WebGL renderer, whose materials did not match the founder's reference.

`glass-artwork.module.css` owns artwork layout and motion. `welcome-hero.module.css` owns page layout, labels and controls. `config.ts` owns copy and destinations; `hero-object.tsx` owns captions and the pause control. Student layer text lives in `hero-visual.tsx`; college and employer callouts are native HTML in `hero-object.tsx`.

The pause control stops the glass motion; the native callout text stays still and selectable. IntersectionObserver and document visibility suspend movement off screen. Reduced-motion preferences show settled objects. Next Image serves responsive versions, preloads only the initial audience's principal image and reuses the same slab/node URL across instances. Original alpha channels are preserved. No runtime dependency was added.

The raw node source has an off-centre composition, so its animated image viewport crops it through CSS while retaining the untouched original asset.
