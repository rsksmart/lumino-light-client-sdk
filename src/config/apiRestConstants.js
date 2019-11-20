// This is the default URL for a Lumino HUB
import Lumino from "../index";

export const API_BASE_URL = Lumino ? Lumino.getConfig().hubEndpoint : "";
