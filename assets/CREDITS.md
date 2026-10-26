# Credits

## Character sprites (assets/characters)

Original artwork drawn procedurally by `tools/generate_sprites.py` for this project.
No third-party images, sprites, or characters were used or traced.

To change colors, hairstyles, or add new characters, edit the `CHARACTERS` list in
`tools/generate_sprites.py` and run:

    pip install pillow
    python3 tools/generate_sprites.py assets/characters

Then add the new file to `src/data/characters.ts`.
