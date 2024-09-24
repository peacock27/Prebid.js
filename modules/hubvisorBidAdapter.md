# Hubvisor Bid adapter

## Overview

```
- Module Name: Hubvisor Bidder Adapter
- Module Type: Hubvisor Bidder Adapter
- Maintainer: support@hubvisor.io
```

## Description

Module that connects to Hubvisor demand sources and supports the following media types: `banner`, `video`.

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
            selector: '#div-prebid-video',
          },
        },
      },
    ],
  },
];
```

Parameters can be optionally passed under the `bid.params.video` object in order to configure the video player's behavior.

The following parameters can be used:
| Parameter     | Required | Type                  | Example  | Description                                                                   |
|---------------|----------|-----------------------|----------|-------------------------------------------------------------------------------|
| `maxWidth`    | No       | `number`              | `602`    | The player's maximum width                                                    |
| `targetRatio` | No       | `number`              | `1.77`   | The player's target aspect ratio                                              |
| `selector`    | No       | `string` or `Element` | `"#div"` | A selector or an HTML element into which the video player should be injected. |
