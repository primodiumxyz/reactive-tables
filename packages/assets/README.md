# Assets Packing

This package provides a set of tools for working with sprite sheets and tilesets.

## Sprites

To create a new Sprite animation you need to define a new folder structure inside of the `sprites` folder. Inside of that folder, create a series of images defining the frames of the animation. The name of the folder will be the name of the animation. The names of the images should be the `{animation_name}-{frame number}.png`.

Example:

```
  sprites/
    player/
      walk/
        walk-0.png
        walk-1.png
        walk-2.png
        walk-3.png
        walk-4.png
```

## Tilesets

Tilesets are currently directly copied to client for now.

TODO: Generate tilesets from individual images.

## Exporting

Export does a few things:

1. Creates a single image sprite atlas for all of your animations
2. Creates an atlas manifest json file that maps the animation names to the frames in the atlas
3. Moves all created files into your game client package

To export, run `pnpm run export`.

Borrowed from, [MUD Phaser Template](https://github.com/latticexyz/mud/tree/086be4ef4f3c1ecb3eac0e9554d7d4eb64531fc2/templates/phaser/packages/art).
