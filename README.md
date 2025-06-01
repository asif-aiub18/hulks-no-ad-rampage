# Hulk’s No-Ad Rampage for YT

**Smash YouTube ads like Hulk smashes villains — with style and power!**

---

## Overview

Welcome to **Hulk’s No-Ad Rampage for YT** — your ultimate Tampermonkey userscript that obliterates YouTube ads with Hulk-level strength! This script automatically mutes ads, reloads your video to dodge stubborn ads, skips sponsored segments via SponsorBlock, and lets you control everything from a sleek, draggable control panel packed with Hulk-themed and other colorful UI themes. Whether you're chilling or raging, enjoy smooth, uninterrupted YouTube watching — no ads, no distractions!

---

## Features

* **Ad Muting:** Automatically mutes YouTube ads so you don’t have to suffer through the noise.
* **Reload & Resume:** Reloads the video page when ads appear and resumes playback at the exact timestamp.
* **Fallback Navigation:** If reload fails multiple times, goes back and forth in history to reload video without ads.
* **SponsorBlock Integration:** Automatically skips sponsored segments within videos.
* **Draggable Control Panel:** Easily move the control panel anywhere below the video.
* **Toggle Controls:** User-friendly toggles for muting, reloading, SponsorBlock, and theme selection.
---

## Installation

### Requirements

* **Tampermonkey** or **Violentmonkey** browser extension installed on your browser.
* Supported browsers include Chrome, Firefox, Edge, Opera, and others supporting userscripts.

### Steps

1. Install [Tampermonkey](https://www.tampermonkey.net/) extension for your browser.
2. Click on the **Raw** button or download the script file `hulks-no-ad-rampage.user.js` from this repository.
3. Open Tampermonkey dashboard and select **Create a new script**.
4. Paste the entire script code or import the downloaded file.
5. Save the script.
6. Navigate to YouTube and enjoy an ad-free, Hulk-powered experience!

---

## Usage

* The draggable control panel appears just below the video player.
* Use the checkboxes to toggle:

  * **Mute during ads**
  * **Reload & resume on ad detection**
  * **Skip sponsors via SponsorBlock**
* Click any theme button to instantly change the control panel’s look.
* Drag the panel to reposition it anywhere you want on the video container.
* The script works automatically in the background, continuously monitoring ads and sponsor segments.

---

## Configuration

You can customize the default behavior and themes inside the script’s `SETTINGS` and `THEMES` objects.

---

## Contribution

Feel free to open issues or submit pull requests. HulkBhai welcomes all who want to help smash ads!

---

## Disclaimer

This userscript is designed for personal use to improve your YouTube experience. It relies on YouTube’s current page structure and third-party APIs, so occasional breakage may happen due to platform changes.
