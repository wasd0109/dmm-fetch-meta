# A script for fetching metadata from DMM.co.jp

## What it does

This script identify all video file in the provided directory and rename it to standard **XXXX-123.extension** format.

Then the video is moved to a folder of its own name and metadata (cover image and title) will be downloaded.

The cover image will be put in the same folder while the title will be part of the folder name in the format **[XXXX-123]TITLE_OF_THE_VIDEO**.

## How to use

Clone the repo to whatever folder you like
Use npm run with 1 argument, the path towards the folder where the videos are located.

```
npm run [path to the folder]
```

## Current limitation

- Video files already in a folder will not be renamed (will address in future)
- The format is currently fixed
- Error handling is still not ideal

## Roadmap

- [ ] Rename video within folder
- [ ] Allow user to change the folder/filename format

## Future

This is a simple personal project and feature will be added if I or anyone using it wanted one.
But a general roadmap is as above.
