import { createWorkerAddon, runCli } from "@watchedcom/sdk";
import { directoryHandler, itemHandler } from "./handlers";
import { getDashboards } from "./ard.service";

const main = async () => {
  const ardMediathekAddon = createWorkerAddon({
    id: "watched-addon-ard-mediathek",
    name: "ARD Mediathek",
    icon: "https://www.ardmediathek.de/images/CiPOTLni.png",
    version: "0.0.0",
    itemTypes: ["movie", "series", "directory"],
    rootDirectories: [],
    dashboards: await getDashboards(),
    defaultDirectoryOptions: {
      imageShape: "landscape",
      displayName: true,
    },
  });

  ardMediathekAddon.registerActionHandler("directory", directoryHandler);
  ardMediathekAddon.registerActionHandler("item", itemHandler);

  runCli([ardMediathekAddon]);
};

main();