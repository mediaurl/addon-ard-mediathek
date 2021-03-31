import { createAddon, runCli } from "@mediaurl/sdk";
import { directoryHandler, itemHandler } from "./handlers";
import { getDashboards } from "./ard.service";

const main = async () => {
  const ardMediathekAddon = createAddon({
    id: "ard-mediathek",
    name: "ARD Mediathek",
    icon: "https://www.ardmediathek.de/images/CiPOTLni.png",
    version: "1.0.0",
    itemTypes: ["movie", "series", "directory"],
    catalogs: [
      {
        features: {
          search: { enabled: true },
        },
        options: {
          imageShape: "landscape",
          displayName: true,
        },
      },
    ],
    dashboards: await getDashboards(),
  });

  ardMediathekAddon.registerActionHandler("catalog", directoryHandler);
  ardMediathekAddon.registerActionHandler("item", itemHandler);

  runCli([ardMediathekAddon], { singleMode: true });
};

main();
