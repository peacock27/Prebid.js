# Hubvisor Bid adapter

## Overview

```
- Module Name: Hubvisor Bidder Adapter
- Module Type: Hubvisor Bidder Adapter
- Maintainer: support@hubvisor.io
```

## Description

Module that connects to Hubvisor demand sources and supports the following media types: `banner`, `video`.

## Configuring the outstream video player

You can set the following optional parameters under `bid.params.video` to configure the video player's behavior:
| Parameter     | Type                  | Example  | Description                                                                   |
|---------------|-----------------------|----------|-------------------------------------------------------------------------------|
| `maxWidth`    | `number`              | `602`    | The player's maximum width                                                    |
| `targetRatio` | `number`              | `1.77`   | The player's target aspect ratio                                              |
| `selector`    | `string` or `Element` | `"#div"` | A selector or an HTML element into which the video player should be injected. |

## Enabling test mode

You can enable test mode by calling the `pbjs.setBidderConfig` function as follows:

```js
pbjs.setBidderConfig({
  bidders: ["hubvisor"],
  config: {
    // Enables test mode
    test: true,
  },
});
```

When test mode is enabled, Hubvisor's server will return test bids that can be used to test the adapter's integration.

## Test Parameters

```javascript
var adUnits = [
  {
    code: "div-prebid-banner",
    mediaTypes: {
      banner: {
        sizes: [[300, 250]],
      },
    },
    bids: [
      {
        bidder: "hubvisor",
        params: {
          placementId: "00000000-0000-0000-0000-000000000000",
        },
      },
    ],
  },
  {
    code: "div-prebid-video",
    mediaTypes: {
      video: {
        playerSize: [[300, 250]],
        context: "outstream",
      },
    },
    bids: [
      {
        bidder: "hubvisor",
        params: {
          placementId: "00000000-0000-0000-0000-000000000000",
          video: {
            maxWidth: 602,
            targetRatio: 1.77,
            selector: "#div-prebid-video",
          },
        },
      },
    ],
  },
];
```