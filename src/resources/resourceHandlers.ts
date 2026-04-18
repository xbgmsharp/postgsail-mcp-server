import { RESOURCES } from "../resources/resources.js";

export const resourcesMap: Map<string, any> = new Map();

export async function loadResources(): Promise<void> {
  try {
    const resourceFiles = RESOURCES.map((res) => res.uri.split("://")[1]);

    for (const file of resourceFiles) {
      try {
        const resourceName = file.replace(/_/g, "-");
        const url = `https://openplotter.cloud/resources/${resourceName}.json`;
        console.error("loadResources_web file:", url);
        const fetchResult = await fetch(url);

        if (!fetchResult.ok) {
          throw new Error(`Download failed: ${JSON.stringify(fetchResult)}`);
        }
        const content = await fetchResult.text();
        resourcesMap.set(`postgsail://${file}`, JSON.parse(content));
      } catch (error: any) {
        console.error(`Failed to load resource ${file}:`, error.message);
      }
    }
  } catch (error: any) {
    console.error("Failed to load web resources:", error.message);
  }
}

export async function handleResourceCall(request: any) {
  const { uri } = request.params;

  try {
    const resourceContent = resourcesMap.get(uri);
    if (resourceContent) {
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(resourceContent, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  } catch (error: any) {
    throw new Error(`Resource read failed: ${error.message}`);
  }
}
