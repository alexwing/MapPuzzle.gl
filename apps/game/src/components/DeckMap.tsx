import React, { useContext, useMemo } from "react";
import { GeoJsonLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { AmbientLight, DirectionalLight, LightingEffect, LayerExtension } from "@deck.gl/core";
import GL from "@luma.gl/constants";
import {
  AlphaColor,
  colorStroke,
  hexToRgb,
  lineWidth,
  setColor,
} from "../lib/Utils";
import { PieceEvent, PieceProps, ViewStateEvent } from "../models/Interfaces";
import ThemeContext from "./ThemeProvider";
import { useCanRotate } from "../lib/hooks/useCanRotate";
import { BackdropFeature, useEqualEarthBackdrop } from "../lib/hooks/useEqualEarthBackdrop";
import { equalEarthScenery, Projection } from "../lib/equalEarth";
import Map, { ViewState } from "react-map-gl";

export interface PlacementFeedback {
  id: number;
  status: "success" | "fail";
  timestamp: number;
}

// Custom procedural shader extension: applies a delicate gradient fading towards white at the top
// while preserving the pure 2D palette colors at the bottom without mesh triangulation seams
class SurfaceGradientExtension extends LayerExtension {
  getShaders() {
    return {
      inject: {
        "fs:DECKGL_FILTER_COLOR": `
          // Delicate vertical gradient towards white at the top, preserving pure pastel colors
          vec2 screenPos = gl_FragCoord.xy / vec2(1920.0, 1080.0);
          float whiteFactor = clamp(screenPos.y * 0.8 + (1.0 - screenPos.x) * 0.2, 0.0, 1.0);
          color.rgb = mix(color.rgb, vec3(1.0), whiteFactor * 0.25);
        `,
      },
    };
  }
}

const surfaceGradientExtension = new SurfaceGradientExtension();

type Color = [number, number, number, number];

/**
 * What the Equal Earth view is drawn on.
 *
 * In Mercator the map sits on CARTO's tiles, and those cannot be bent — vector
 * tiles are Mercator by construction — so in Equal Earth the scenery is drawn
 * here instead: the outline of the planisphere filled as ocean, the world's
 * land in a neutral tone so a country's puzzle keeps its neighbours, its lakes
 * in the water's tone and its main rivers a shade deeper, and a 30° graticule
 * over it all. Behind the outline the page shows the app's own background,
 * which follows the theme on its own.
 */
const SCENERY: Record<
  "light" | "dark",
  { ocean: Color; land: Color; river: Color; edge: Color; graticule: Color }
> = {
  light: {
    ocean: [213, 227, 238, 255],
    land: [246, 243, 236, 255],
    river: [150, 181, 209, 255],
    edge: [71, 85, 105, 120],
    graticule: [71, 85, 105, 40],
  },
  dark: {
    ocean: [15, 26, 39, 255],
    land: [28, 36, 49, 255],
    river: [52, 78, 108, 255],
    edge: [148, 163, 184, 110],
    graticule: [148, 163, 184, 36],
  },
};

const PAGE_STYLE = { background: "var(--bg-app)" };

interface DeckMapProps {
  onClickMap: (e: PieceEvent) => void;
  onHoverMap: (e: PieceEvent) => void;
  onViewStateChange?: (e: ViewStateEvent) => void;
  viewState: ViewState;
  founds: Array<number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  is3D?: boolean;
  feedbackPiece?: PlacementFeedback | null;
  /**
   * Which projection `data` has been prepared for. Equal Earth data arrives
   * already bent (see lib/equalEarth); what changes here is the ground under
   * it, since the Mercator tiles cannot follow.
   */
  projection?: Projection;
}

function DeckMap({
  onClickMap,
  onHoverMap,
  onViewStateChange,
  viewState,
  founds,
  data,
  is3D = false,
  feedbackPiece = null,
  projection = "mercator",
}: DeckMapProps): JSX.Element | null {
  const { theme } = useContext(ThemeContext);
  const [currentViewState, setCurrentViewState] = React.useState<ViewState>(viewState);

  React.useEffect(() => {
    if (viewState?.zoom) {
      setCurrentViewState(viewState);
    }
  }, [viewState]);

  const handleViewStateChange = React.useCallback(
    (e: ViewStateEvent) => {
      if (e?.viewState) {
        setCurrentViewState(e.viewState as ViewState);
      }
      onViewStateChange?.(e);
    },
    [onViewStateChange]
  );

  const mapStyle = useMemo(() => {
    return theme === "light"
      ? "https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";
  }, [theme]);

  const equalEarth = projection === "equalEarth";
  const backdrop = useEqualEarthBackdrop(equalEarth);

  // The ground of the Equal Earth view, bottom to top: ocean inside the
  // outline, the land and its water once they have arrived, the graticule over
  // all of it. None of it can be picked, so a click on the sea still misses,
  // as it does now.
  const scenery = useMemo(() => {
    if (!equalEarth) return [];
    const palette = SCENERY[theme === "dark" ? "dark" : "light"];
    const { outline, graticule } = equalEarthScenery();
    const ground = [
      new GeoJsonLayer({
        id: "equal-earth-outline",
        data: outline,
        stroked: true,
        filled: true,
        getFillColor: palette.ocean,
        getLineColor: palette.edge,
        lineWidthMinPixels: 1.5,
        pickable: false,
      }),
    ];
    if (backdrop) {
      ground.push(
        new GeoJsonLayer({
          id: "equal-earth-land",
          data: backdrop.land,
          stroked: false,
          filled: true,
          getFillColor: palette.land,
          pickable: false,
        }),
        // Lakes filled like the sea; rivers as hairlines a shade deeper, so a
        // single pixel of them still reads as water on the land.
        new GeoJsonLayer({
          id: "equal-earth-water",
          data: backdrop.water,
          stroked: false,
          filled: true,
          getFillColor: palette.ocean,
          getLineColor: palette.river,
          lineWidthUnits: "pixels",
          getLineWidth: (feature: BackdropFeature) => feature.properties?.w ?? 1,
          pickable: false,
        })
      );
    }
    ground.push(
      new GeoJsonLayer({
        id: "equal-earth-graticule",
        data: graticule,
        stroked: true,
        filled: false,
        getLineColor: palette.graticule,
        lineWidthMinPixels: 1,
        pickable: false,
      })
    );
    return ground;
  }, [equalEarth, theme, backdrop]);

  // Lighting calibrated for maximum 2D color fidelity with subtle south-wall depth
  const lightingEffect = useMemo(() => {
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 1.0, // 100% ambient luminosity preserves true 2D colors
    });
    // Directional light from North providing gentle shadow on south-facing walls
    const dirLight = new DirectionalLight({
      color: [255, 250, 240],
      intensity: 0.55,
      direction: [-1.8, 2.5, -2.0],
    });
    return new LightingEffect({ ambientLight, dirLight });
  }, []);

  const material = useMemo(() => {
    return is3D
      ? {
          ambient: 0.95, // 95% ambient keeps colors very close to 2D
          diffuse: 0.45, // Enough diffuse to shade south-facing vertical walls noticeably
          shininess: 0,
          specularColor: [0, 0, 0] as [number, number, number],
        }
      : undefined;
  }, [is3D]);

  const layers = useMemo(() => {
    if (!data) return [];

    // Calculate real-time elevationScale so 3D pieces maintain exact screen pixel thickness:
    // 4px at world/global scale (zoom <= 3), smoothly scaling to 8px at country/regional scale (zoom >= 5)
    const zoom = currentViewState?.zoom || 3;
    const latitudeRad = ((currentViewState?.latitude ?? 20) * Math.PI) / 180;
    const metersPerPixel = (156543.03392 * Math.cos(latitudeRad)) / Math.pow(2, zoom);
    const targetPixels = zoom <= 3 ? 4 : (zoom >= 5 ? 8 : 4 + (zoom - 3) * 2);
    const calculatedElevationScale = targetPixels * metersPerPixel;

    return [
      // Base layer for map borders, unplaced pieces and error feedback:
      // Always flat (extruded: false) so border lines look identical in 2D and 3D exactly as in production
      new GeoJsonLayer({
        id: "geojson-base-layer",
        data: data,
        pointRadiusMinPixels: 6,
        extruded: false,
        getLineColor: (object: PieceProps) => {
          const id = object?.properties?.cartodb_id;
          if (feedbackPiece && feedbackPiece.id === id && feedbackPiece.status === "fail") {
            return [239, 68, 68, 180]; // Soft red border on error
          }
          return colorStroke;
        },
        getFillColor: (object: PieceProps) => {
          const id = object?.properties?.cartodb_id;
          // Error feedback: cuasi-transparente red on incorrectly clicked region
          if (feedbackPiece && feedbackPiece.id === id && feedbackPiece.status === "fail") {
            return [239, 68, 68, 45];
          }
          return [0, 0, 0, 0];
        },
        opacity: 1,
        pickable: true,
        lineWidthMinPixels: lineWidth,
        updateTriggers: {
          getFillColor: [feedbackPiece],
          getLineColor: [feedbackPiece],
        },
        onClick: onClickMap,
        onHover: onHoverMap,
      }),

      // Placed 3D pieces layer:
      // Extrudes and receives dynamic lighting only when is3D is enabled and piece is found
      new GeoJsonLayer({
        id: "geojson-placed-layer",
        data: data,
        pointRadiusMinPixels: 6,
        extruded: is3D,
        elevationScale: is3D ? calculatedElevationScale : 0,
        wireframe: false,
        material: material,
        getElevation: (object: PieceProps) => {
          const id = object?.properties?.cartodb_id;
          return founds.includes(id) ? 1 : 0;
        },
        getLineColor: colorStroke,
        getFillColor: (object: PieceProps) => {
          const id = object?.properties?.cartodb_id;
          if (founds.includes(id)) {
            return AlphaColor({
              col: hexToRgb(setColor(object?.properties?.mapcolor)),
              alpha: 150, // Matches 2D alpha (150) exactly for identical transparency and tone
            });
          }
          return [0, 0, 0, 0];
        },
        opacity: 1,
        pickable: true,
        lineWidthMinPixels: lineWidth,
        extensions: is3D ? [surfaceGradientExtension] : [],
        parameters: is3D
          ? {
              cull: true,
              cullFace: GL.BACK,
              [GL.CULL_FACE]: true,
              [GL.CULL_FACE_MODE]: GL.BACK,
              depthTest: true,
              depthMask: true,
            }
          : undefined,
        transitions: {
          getElevation: {
            duration: 400,
            enter: () => [0],
          },
        },
        updateTriggers: {
          getFillColor: [founds, is3D],
          getElevation: [founds],
        },
        onClick: onClickMap,
        onHover: onHoverMap,
      }),
    ];
  }, [data, founds, is3D, feedbackPiece, currentViewState?.zoom, currentViewState?.latitude, material, onClickMap, onHoverMap]);

  const allLayers = useMemo(() => [...scenery, ...layers], [scenery, layers]);

  const canRotate = useCanRotate();
  const controller = useMemo(
    () =>
      canRotate
        ? true
        : {
            dragRotate: false,
            touchRotate: false,
            keyboard: { rotateSpeedX: 0, rotateSpeedY: 0 },
            minPitch: 0,
            maxPitch: 0,
          },
    [canRotate]
  );

  const getCursor = useMemo(() => {
    return ({ isDragging, isHovering }: { isDragging?: boolean; isHovering?: boolean }) => {
      if (isDragging) return "url('/cursors/grabbing.svg') 12 8, grabbing";
      if (isHovering) return "pointer";
      return "url('/cursors/grab.svg') 12 8, grab";
    };
  }, []);

  const effects = useMemo(() => (is3D ? [lightingEffect] : []), [is3D, lightingEffect]);

  return !viewState?.zoom || !data ? null : (
    <React.Fragment>
      <DeckGL
        width="100%"
        height="100%"
        initialViewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={controller}
        layers={allLayers}
        effects={effects}
        getCursor={getCursor}
        style={equalEarth ? PAGE_STYLE : undefined}
      >
        {/* The tiles are Mercator and cannot follow the bent geometry, so in
            Equal Earth the ground is the scenery above and no base map. */}
        {!equalEarth && <Map mapStyle={mapStyle} />}
      </DeckGL>
    </React.Fragment>
  );
}
/**
 * Deliberately NOT memoised.
 *
 * @deck.gl/react calls deck.setProps on every render of this component, and
 * that is what keeps deck's own clock moving: memoise it and a running
 * animation gets one update and then jumps straight to its end, because the
 * next tick it sees is already past the duration. Measured — the tilt went
 * from 0° to 45° in six milliseconds with two frames in between.
 *
 * The parent re-renders on every frame the map reports, which is what drives
 * it. That is only safe because what the parent commands and what the map
 * reports are now two separate pieces of state, so those renders arrive with
 * the very same initialViewState object and deck has nothing to adopt.
 */
export default DeckMap;
