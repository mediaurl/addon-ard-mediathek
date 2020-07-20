import fetch from "node-fetch";
import { DashboardItem } from "@watchedcom/sdk";
import { stringify as stringifyQuery } from "querystring";
import { HomeResponse } from "./types";

// Item
// https://api.ardmediathek.de/page-gateway/pages/ard/item/Y3JpZDovL2Rhc2Vyc3RlLmRlL2Zlcm5zZWhmaWxtZSBpbSBlcnN0ZW4vM2I2NjJkOTgtZDc5NC00ZDExLWIyZDctYTZiNTcwNGM3ZWEz?devicetype=pc

// Home
// https://api.ardmediathek.de/page-gateway/pages/ard/home

// Search
// https://api.ardmediathek.de/page-gateway/widgets/ard/search/vod?searchString=test&pageNumber=0&pageSize=12

export const fixStreamUrl = (url: string) => url.replace(/^\/\//, "http://");

export const makeRequest = <T = any>(url: string, qs?: any): Promise<T> => {
  return fetch(url + (qs ? "?" + stringifyQuery(qs) : "")).then((resp) =>
    resp.json()
  );
};

export const getDashboards = (): Promise<DashboardItem[]> => {
  return makeRequest<HomeResponse>(
    "https://api.ardmediathek.de/page-gateway/pages/ard/home"
  ).then((data) => {
    return data.widgets.map((widget) => {
      return {
        id: widget.links.self.href.split("?")[0],
        name: widget.title,
      };
    });
  });
};
