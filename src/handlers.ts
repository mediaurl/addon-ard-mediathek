import {
  ActionHandlers,
  CatalogResponse,
  MainItem,
  Source,
} from "@mediaurl/sdk";
import { fixStreamUrl, makeRequest } from "./ard.service";
import { CompilationResponse, ItemResponse, TeaserTypes } from "./types";

const DIRECTORY_TYPES: TeaserTypes[] = ["compilation", "show"];

const mapCompilationResponse = (data: CompilationResponse): CatalogResponse => {
  const root = data?.widgets?.[0] ?? data;
  const pageNumber = root.pagination.pageNumber;
  const teasers = root.teasers;
  const isEndPage =
    (root.pagination.pageNumber + 1) * root.pagination.pageSize >
    root.pagination.totalElements;

  return {
    items: teasers.map<MainItem>((teaser) => {
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
    nextCursor: isEndPage ? null : pageNumber + 1,
  };
};

export const directoryHandler: ActionHandlers["catalog"] = async (
  input,
  ctx
) => {
  // console.log("directory", input);
  await ctx.requestCache([input.cursor, input.search, input.id], {
    ttl: "7d",
    refreshInterval: "1h",
  });

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
    input.id as string, //.replace("/pages/", "/widgets/"),
    { pageNumber }
  ).then(mapCompilationResponse);
};

export const itemHandler: ActionHandlers["item"] = async (input, ctx) => {
  // console.log("item", input);
  await ctx.requestCache([input.ids.id, input.region], {
    ttl: "7d",
    refreshInterval: "1h",
  });

  /** Geo restrictions based on IP */
  const jsonResp = await ctx
    .fetch(input.ids.id as string)
    .then<ItemResponse>((data) => data.json());

  const widget = jsonResp.widgets[0];

  const sources =
    widget.mediaCollection?.embedded._mediaArray[0]._mediaStreamArray ?? [];
  const filteredSources = sources.filter(
    (_) => typeof _._quality === "number" && _._height
  );
  const responseSources = filteredSources.length ? filteredSources : sources;

  const geoBlockingApplied = await new Promise<boolean>(async (resolve) => {
    const akamaiSource = responseSources.find((s) => s._cdn === "akamai");
    if (!akamaiSource) {
      return resolve(false);
    }

    const resp = await ctx.fetch(fixStreamUrl(akamaiSource._stream as string), {
      method: "GET",
      headers: {
        Range: "bytes=0-1",
      },
    });

    const isOk = resp.ok;

    return resolve(!isOk);
  });

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
        url: fixStreamUrl(_._stream as string),
      };
    }),
  };
};
