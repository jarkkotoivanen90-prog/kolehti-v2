// only relevant diff: import and install addiction layer
import { installFeedAddictionLayer } from "../lib/feedAddictionLayer";

// ...inside useEffect after installFeedUltraProMotion():
const addictionCleanup = installFeedAddictionLayer();

// ...inside cleanup:
addictionCleanup?.();
