# Hell Rowdy

JUCE-based MIDI Generator Plugin.

## Installation

### Windows
1. Download the `HellRowdy-VST3-Windows` artifact.
2. Copy `Hell Rowdy.vst3` to your VST3 folder (usually `C:\Program Files\Common Files\VST3`).

### macOS
1. Download the `HellRowdy-Mac` artifact.
2. Unzip and copy `Hell Rowdy.vst3` to `/Library/Audio/Plug-Ins/VST3` and `Hell Rowdy.component` to `/Library/Audio/Plug-Ins/Components`.

#### Troubleshooting: "File is damaged" or Gatekeeper issues
If macOS prevents the plugin from running with a "damaged" error, run the following command in Terminal:

```bash
sudo xattr -cr /Library/Audio/Plug-Ins/VST3/"Hell Rowdy.vst3"
sudo xattr -cr /Library/Audio/Plug-Ins/Components/"Hell Rowdy.component"
```

This command removes the "quarantine" attribute that macOS adds to files downloaded from the internet.
