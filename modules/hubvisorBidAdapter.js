import { BANNER, VIDEO } from "../src/mediaTypes.js";
import { registerBidder } from "../src/adapters/bidderFactory.js";
import { config } from "../src/config.js";
import {
  isStr,
  isFn,
  logInfo,
  logWarn,
  logError,
  deepSetValue,
} from "../src/utils.js";
import { Renderer } from "../src/Renderer.js";
import { ortbConverter } from "../libraries/ortbConverter/converter.js";

const BIDDER_CODE = "hubvisor";

const TEST_CONFIG_KEY = "test";

const SYNC_ENDPOINT = "https://relay.hubvisor.io/v1/sync/pbjs";
const AUCTION_ENDPOINT = "https://relay.hubvisor.io/v1/auction/pbjs";

const HUBVISOR_PLAYER_URL = "https://cdn.hubvisor.io/wrapper/common/player.js";

const SYNC_TYPES = {
  image: "image",
  redirect: "image",
  iframe: "iframe",
};

const videoParametersByBidId = {};

function isTest() {
  return config.getConfig(TEST_CONFIG_KEY) === true;
}

function getPlacementIdFromBidRequest(bidRequest) {
  return bidRequest.params?.placementId;
}

const converter = ortbConverter({
  context: {
    netRevenue: true,
    ttl: 30,
  },
  request(buildRequest, imps, bidderRequest, context) {
    const request = buildRequest(imps, bidderRequest, context);

    if (request.site) {
      request.site.publisher = request.publisher;
    }

    delete request.publisher;

    request.test = isTest() ? 1 : 0;

    return request;
  },
  imp(buildImp, bidRequest, context) {
    const imp = buildImp(bidRequest, context);

    deepSetValue(
      imp,
      "ext.hubvisor.placementId",
      getPlacementIdFromBidRequest(bidRequest)
    );

    return imp;
  },
});

export const spec = {
  version: "0.0.1",
  code: BIDDER_CODE,
  gvlid: 1112,
  supportedMediaTypes: [BANNER, VIDEO],
  isBidRequestValid(bid) {
    return true;
  },
  buildRequests(bidRequests, bidderRequest) {
    const { gdprConsent = {} } = bidderRequest;
    const placementIds = bidRequests
      .map(getPlacementIdFromBidRequest)
      .filter((id) => !!id);

    // Auction request

    const auctionRequest = converter.toORTB({ bidRequests, bidderRequest });

    for (const bidRequest of bidRequests) {
      if (bidRequest.mediaTypes.video) {
        videoParametersByBidId[bidRequest.biidId] = bidRequest.params.video;
      }
    }

    // Sync request

    const syncRequest = {
      gdpr: gdprConsent.gdprApplies ?? false,
      placement_ids: placementIds.join(","),
    };

    if (gdprConsent.consentString) {
      syncRequest.gdpr_consent = gdprConsent.consentString;
    }

    return [
      {
        method: "GET",
        url: SYNC_ENDPOINT,
        data: syncRequest,
      },
      {
        method: "POST",
        url: AUCTION_ENDPOINT,
        data: auctionRequest,
      },
    ];
  },
  interpretResponse(response, request) {
    const bids = converter.fromORTB({
      response: response.body,
      request: request.data,
    }).bids;

    for (const bid of bids) {
      if (bid.mediaType === "video") {
        const videoParameters = videoParametersByBidId[bid.bidId];

        delete videoParametersByBidId[bid.biidId];

        bid.renderer = makeOutstreamRenderer(bid, videoParameters);
      }
    }

    return bids;
  },
  getUserSyncs(syncOptions, serverResponses) {
    if (serverResponses.length !== 2) {
      return;
    }

    const [sync] = serverResponses;

    return sync.body?.bidders?.reduce((acc, { type, url }) => {
      const syncType = SYNC_TYPES[type];

      if (!syncType || !url) {
        return acc;
      }

      return acc.concat({ type: syncType, url });
    }, []);
  },
};

registerBidder(spec);

function makeOutstreamRenderer(bid, videoParameters = {}) {
  const renderer = Renderer.install({
    id: bid.id,
    url: HUBVISOR_PLAYER_URL,
    loaded: false,
    config: {
      maxWidth: videoParameters.maxWidth,
      targetRatio: videoParameters.targetRatio,
      selector: videoParameters.selector,
    },
  });

  renderer.setRender(render);

  return renderer;
}

function render(bid) {
  const config = bid.renderer.getConfig();

  bid.renderer.push(() => {
    playOutstream(getSelector(config, bid), {
      vastXml: bid.vastXml,
      vastUrl: bid.vastUrl,
      targetWidth: bid.width,
      targetHeight: bid.height,
      maxWidth: config.maxWidth,
      targetRatio: config.targetRatio,
      expand: "no-lazy-load",
      onEvent: (event) => {
        switch (event) {
          case "impression":
            logInfo(`Video impression for ad unit ${bid.adUnitCode}`);
          case "error":
            logWarn(`Error while playing video for ad unit ${bid.adUnitCode}`);
        }
      },
    });
  });
}

function playOutstream(containerOrSelector, options) {
  const container = getContainer(containerOrSelector);

  if (!window.HbvPlayer) {
    return logError("Failed to load player!");
  }

  window.HbvPlayer.playOutstream(container, options);
}

function getSelector(config, bid) {
  if (config.selector) {
    return config.selector;
  }

  if (window.CSS) {
    return `#${window.CSS.escape(bid.adUnitCode)}`;
  }

  return `#${bid.adUnitCode}`;
}

function getContainer(containerOrSelector) {
  if (isStr(containerOrSelector)) {
    const container = document.querySelector(containerOrSelector);

    if (container) {
      return container;
    }

    logError(`Player container not found for selector ${containerOrSelector}`);

    return undefined;
  }

  if (isFn(containerOrSelector)) {
    const container = containerOrSelector();

    if (container) {
      return container;
    }

    logError("Player container not found for selector function");

    return undefined;
  }

  return containerOrSelector;
}
