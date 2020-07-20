import {
  WorkerHandlers,
  PlayableItem,
  MainItem,
  Source,
  DirectoryResponse,
} from "@watchedcom/sdk";
import { makeRequest } from "./ard.service";
import { CompilationResponse, ItemResponse, TeaserTypes } from "./types";

const DIRECTORY_TYPES: TeaserTypes[] = ["compilation"];

const mapCompilationResponse = (
  data: CompilationResponse
): DirectoryResponse => {
  const {
    pagination: { pageNumber },
  } = data;
  return {
    items: data.teasers.map<MainItem>((teaser) => {
      const href = teaser.links.target.href.split("?")[0];

      return {
        type:
          DIRECTORY_TYPES.indexOf(teaser.type) !== -1 ? "directory" : "movie",
        id: href,
        ids: {
          id: href,
        },
        name: teaser.shortTitle,
        images: {
          poster: Object.values(teaser.images)[0]
            .src.replace("{width}", "900")
            .split("?")[0],
        },
      };
    }),
    nextCursor: pageNumber + 1,
  };
};

export const directoryHandler: WorkerHandlers["directory"] = async (
  input,
  ctx
) => {
  console.log("directory", input);
  await ctx.requestCache(input);

  const pageNumber = input.cursor || 0;

  if (input.search) {
    return makeRequest(
      "https://api.ardmediathek.de/page-gateway/widgets/ard/search/vod",
      {
        searchString: input.search,
        pageNumber,
      }
    ).then(mapCompilationResponse);
  }

  return makeRequest<CompilationResponse>(
    (input.id as string).replace("/pages/", "/widgets/"),
    { pageNumber }
  ).then(mapCompilationResponse);
};

export const itemHandler: WorkerHandlers["item"] = async (input, ctx) => {
  console.log("item", input);
  await ctx.requestCache(input);

  /** Geo restrictions based on IP */
  const jsonResp = await ctx
    .fetch(input.ids.id as string)
    .then<ItemResponse>((data) => data.json());

  const widget = jsonResp.widgets[0];

  const sources =
    widget.mediaCollection.embedded._mediaArray[0]._mediaStreamArray;
  const filteredSources = sources.filter(
    (_) => typeof _._quality === "number" && _._height
  );
  const responseSources = filteredSources.length ? filteredSources : sources;

  const geoBlockingApplied = await new Promise<boolean>(async (resolve) => {
    const akamaiSource = responseSources.find((s) => s._cdn === "akamai");
    if (!akamaiSource) {
      return resolve(false);
    }

    const resp = await ctx.fetch(akamaiSource._stream as string, {
      method: "GET",
      headers: {
        Range: "bytes=0-1",
      },
    });

    const isOk = resp.ok;

    return resolve(!isOk);
  });

  console.log({ geoBlockingApplied });

  if (geoBlockingApplied) {
    throw new Error("Item is blocked in your region");
  }

  return {
    type: "movie",
    ids: {
      id: input.ids.id,
    },
    name: widget.title,
    description: widget.synopsis,
    sources: responseSources.map<Source>((_) => {
      const qualityStr = _._height ? ` ${_._height}p` : "";
      return {
        type: "url",
        name: `ARD Mediathek${qualityStr}`,
        url: (_._stream as string).replace(/^\/\//, "http://"),
      };
    }),
  };
};
