import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const IMG = {
  helsinki: "/finland/helsinki.svg",
  slogan: "/finland/lake.svg",
  lake: "/finland/lake.svg",
  forest: "/finland/forest.svg",
  lapland: "/finland/forest.svg",
  road: "/finland/forest.svg",
  archipelago: "/finland/lake.svg",
};

// rest unchanged...