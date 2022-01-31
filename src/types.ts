export type TeaserTypes =
  | "ondemand"
  | "compilation"
  | "live"
  | "show"
  | "poster";

type Link = {
  id: string;
  title: string;
  href: string;
};

type Image = {
  alt: string;
  producerName: string;
  src: string;
  title: string;
};

type Pagination = {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
};

type Teaser = {
  id: string;
  duration: number;
  images: {
    aspect16x9: Image;
    aspect16x7: Image;
    aspect1x1: Image;
  };
  longTitle: string;
  mediumTitle: string;
  shortTitle: string;
  links: {
    self: Link;
    target: Link;
  };
  subtitled: boolean;
  type: TeaserTypes;
};

type CompilationWidget = {
  compilationType: "editorial";
  id: string;
  links: {
    self: Link;
  };
  teasers: Teaser[];
  title: string;
};

export type HomeResponse = {
  id: string;
  title: string;
  widgets: CompilationWidget[];
};

export type ItemResponse = {
  widgets: {
    title: string;
    synopsis: string;
    mediaCollection: {
      embedded: {
        _mediaArray: {
          _mediaStreamArray: {
            _cdn?: "akamai";
            _quality: number | "auto";
            _height: number;
            _stream: string | string[];
          }[];
        }[];
      };
    } | null;
  }[];
};

export type CompilationResponse = {
  teasers: Teaser[];
  pagination: Pagination;
  widgets?: CompilationResponse[];
};
