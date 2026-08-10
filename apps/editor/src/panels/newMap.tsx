import React, { useState, useEffect } from "react";
import { Button, Col, Form, Row, Table } from "react-bootstrap";
import { AlertMessage } from "@mappuzzle/core";
import { LoadingDialog } from "@mappuzzle/core";
import type { MapGeneratorModel } from "@mappuzzle/shared";
import { AlertModel } from "@mappuzzle/core";
import { BackMapCreatorService } from "../services/BackMapCreatorService";

interface NewMapProps {
  /** Called after a map is created, so the shell can refresh its puzzle list. */
  onCreated?: () => void;
}

function NewMap({ onCreated }: NewMapProps): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);

  const [tableList, setTableList] = useState([]);
  /** The chosen layer's fields with a few values each, to pick roles from. */
  const [fields, setFields] = useState(
    [] as { name: string; numeric: boolean; unique: boolean; samples: string[] }[]
  );
  const [pieceCount, setPieceCount] = useState(0);
  const [data, setData] = useState({
    table: "",
    name: "",
    id: "",
    mapColor: "",
    fileJson: "",
    title: "",
  } as MapGeneratorModel);
  /** Once the file name is edited by hand, the title stops overwriting it. */
  const [slugEdited, setSlugEdited] = useState(false);

  const loadTables = async () => {
    const tables = await BackMapCreatorService.getTables();
    if (tables.data) {
      setTableList(tables.data);
      return;
    }
    // The list came back empty, which used to leave the form sitting there
    // looking broken with no explanation.
    setAlert({
      title: "No shapefiles available",
      message:
        tables.msg ??
        "No shapefile layers found. Upload a .zip with a .shp and its sidecars first.",
      type: "warning",
    } as AlertModel);
    setShowAlert(true);
  };
  //load tables at start
  useEffect(() => {
    //get cookie data
   // const cookieData = getCookie("mapGenerator");
    /*if (cookieData) {
      setData(JSON.parse(cookieData));
    }*/
    loadTables();
  }, []);

  //load the layer's fields when one is selected
  useEffect(() => {
    const loadColumns = async () => {
      const preview = await BackMapCreatorService.describeLayer(data.table);
      setFields(preview.fields ?? []);
      setPieceCount(preview.count ?? 0);
      // Suggest a name field, but only when the data really points at one: the
      // first guess here was "the first unique text column", which picked GADM's
      // GID_1 ("SAU.1_1") over NAME_1. Codes carry digits and names generally do
      // not, so candidates are unique text whose sample values have none, and a
      // column actually called *name* wins among them. Nothing convincing means
      // nothing selected: a wrong default that goes unnoticed is worse than a
      // blank one.
      type Field = { name: string; numeric: boolean; unique: boolean; samples: string[] };
      const candidates = ((preview.fields ?? []) as Field[]).filter(
        (f) => !f.numeric && f.unique && !f.samples.some((v) => /\d/.test(v))
      );
      const likelyName =
        candidates.find((f) => /name/i.test(f.name)) ?? candidates[0];
      if (likelyName) setData((d) => ({ ...d, name: likelyName.name }));
    };
    loadColumns();
  }, [data.table]);

  const clearAlert = () => {
    setAlert({
      title: "",
      message: "",
      type: "danger",
    } as AlertModel);
    setShowAlert(false);
  };

  const onSaveHandler = async () => {
    clearAlert();
   /* setCookie(
      "mapGenerator",
      JSON.stringify(data).toString(),
      ConfigService.cookieDays
    )*/
    setLoading(true);
    if (data.table !== "") {
      //PuzzleService.generateJson
      const result = await BackMapCreatorService.generateJson(data);
      setLoading(false);
      if (result?.success) {
        setShowAlert(true);
        setAlert({
          title: "Map created",
          message: `${result.msg} Switch to "Edit a puzzle" to finish setting it up.`,
          type: "success",
        } as AlertModel);
        onCreated?.();
      } else {
        setShowAlert(true);
        setAlert({
          title: "Error",
          message: "Error generating json",
          type: "danger",
        } as AlertModel);
      }
    }
  };

  /**
   * Uploads as soon as a file is chosen: there is nothing to decide in between,
   * and the layer appears in the list straight after, which is what the separate
   * Upload button existed to trigger.
   */
  const uploadShapefile = async (file: File) => {
    setLoading(true);
    try {
      const result = await BackMapCreatorService.importShapefile(
        file,
        file.name.replace(/\.zip$/i, "")
      );
      await loadTables();
      const layers: string[] = result?.data ?? [];
      // One layer in the zip is the common case, so select it and skip a step.
      // The file name is left for the title to generate: seeding it from the
      // layer would put "gadm41_SAU_1" in a field meant to read
      // "saudi_arabia_provinces".
      if (layers.length === 1) {
        setData((d) => ({ ...d, table: layers[0] }));
      }
      setAlert({
        title: result?.success ? "Shapefile read" : "Could not read the shapefile",
        message: result?.msg ?? "No answer from the backend",
        type: result?.success ? "success" : "danger",
      } as AlertModel);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * "Saudi Arabia Provinces" to "saudi_arabia_provinces": accents folded, the
   * rest reduced to letters, digits and single underscores, since this becomes a
   * file name and a URL.
   */
  const slugify = (title: string): string =>
    title
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  /**
   * A column that is not in the .dbf: the piece's position after sorting by
   * name, 1..n.
   *
   * The importer already falls back to it when no id or colour field is chosen,
   * but with a source like GADM, which has no numeric column at all, the only
   * sign of that was two greyed-out options. Showing it as a column makes the
   * default visible and selectable instead of implied. It stays a UI-only idea:
   * choosing it means sending an empty field name, which is what the importer
   * reads as "number them in order".
   */
  const POSITION = "__position__";

  const columns = [
    ...(fields.length > 0
      ? [
          {
            name: POSITION,
            label: "Piece order",
            numeric: true,
            unique: true,
            samples: fields[0].samples.map((_, i) => String(i + 1)),
            synthetic: true,
          },
        ]
      : []),
    ...fields.map((f) => ({ ...f, label: f.name, synthetic: false })),
  ];

  /** Which roles a column holds. Both id and colour can sit on the same one. */
  const roleOf = (field: string): string => {
    const held = field === POSITION ? "" : field;
    const isId = data.id === held;
    const isColor = data.mapColor === held;
    if (data.name === held && held !== "") return "name";
    if (isId && isColor) return "id+color";
    if (isId) return "id";
    if (isColor) return "color";
    return "";
  };

  const assignRole = (field: string, role: string) => {
    const held = field === POSITION ? "" : field;
    setData((d) => {
      // Each role sits on exactly one column, so taking it releases the old one.
      // Releasing id or colour hands it back to the piece order, which is the
      // empty string the importer expects.
      const next = { ...d };
      if (d.name === held) next.name = "";
      if (d.id === held) next.id = "";
      if (d.mapColor === held) next.mapColor = "";
      if (role === "name") next.name = held;
      if (role === "id" || role === "id+color") next.id = held;
      if (role === "color" || role === "id+color") next.mapColor = held;
      return next;
    });
  };

  return (
    <React.Fragment>
      <Col xs={12} lg={12}>
        <LoadingDialog show={loading} delay={1000} />
        <AlertMessage
          show={showAlert}
          alertMessage={alert}
          onHide={clearAlert}
          autoClose={0}
        />
        <Form>
          {/* Step 1. Choosing the file is the whole action: it uploads at once
              and the layer shows up below, which is what the old Upload button
              had to be pressed for. */}
          <Form.Group className="mb-4" controlId="formFile">
            <Form.Label>
              <strong>1.</strong> Shapefile as a .zip
            </Form.Label>
            <Form.Control
              type="file"
              accept=".zip"
              style={{ maxWidth: "28rem" }}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) uploadShapefile(file);
              }}
            />
            <Form.Text>
              Everything in the archive is kept: the .shp with its .dbf, .shx,
              .prj and .cpg.
            </Form.Text>
          </Form.Group>

          {/* Step 2. Which layer, when the archive holds more than one. */}
          <Form.Group className="mb-4" controlId="table">
            <Form.Label>
              <strong>2.</strong> Layer
            </Form.Label>
            <Form.Select
              style={{ maxWidth: "28rem" }}
              value={data.table}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setData({ ...data, table: e.target.value, id: "", name: "", mapColor: "" });
              }}
            >
              {tableList.map((table) => (
                <option key={table} value={table}>
                  {table || "Select a layer…"}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Step 3. The data itself, so the fields can be judged rather than
              guessed at from names like GID_1 and VARNAME_1. */}
          {fields.length > 0 && (
            <div className="mb-4">
              <Form.Label>
                <strong>3.</strong> Fields — {pieceCount} pieces
              </Form.Label>
              <Form.Text className="d-block mb-2">
                Pick which field names the pieces. The id and colour default to
                <em> Piece order</em>, the generated column on the left, which is
                what most sources need: many, GADM among them, carry no numeric
                column at all.
              </Form.Text>
              <div className="newmap-fields">
                <Table size="sm" bordered hover className="mb-0">
                  <thead>
                    <tr>
                      {columns.map((f) => (
                        <th
                          key={f.name}
                          className={
                            "align-top" + (f.synthetic ? " newmap-synthetic" : "")
                          }
                        >
                          <div className="text-nowrap">{f.label}</div>
                          <div className="fw-normal text-muted small mb-1">
                            {f.synthetic
                              ? "generated"
                              : (f.numeric ? "number" : "text") +
                                (f.unique ? ", all different" : "")}
                          </div>
                          {f.synthetic ? (
                            /* Read-only on purpose. The piece order holds
                               whatever no real column has taken, so a select
                               here would offer choices that change nothing;
                               releasing a role on a real column below is what
                               hands it back. */
                            <div className="small">
                              {roleOf(f.name) === "id+color"
                                ? "Piece id and colour"
                                : roleOf(f.name) === "id"
                                ? "Piece id"
                                : roleOf(f.name) === "color"
                                ? "Colour"
                                : "unused"}
                            </div>
                          ) : (
                            <Form.Select
                              size="sm"
                              value={roleOf(f.name)}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                assignRole(f.name, e.target.value)
                              }
                            >
                              <option value="">—</option>
                              <option value="name">Name</option>
                              {/* An id keys custom_wiki and custom_centroids, so
                                  repeated values would collide. */}
                              <option
                                value="id"
                                disabled={!f.numeric || !f.unique}
                              >
                                Piece id
                              </option>
                              <option value="color" disabled={!f.numeric}>
                                Colour
                              </option>
                              <option
                                value="id+color"
                                disabled={!f.numeric || !f.unique}
                              >
                                Piece id and colour
                              </option>
                            </Form.Select>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: fields[0]?.samples.length ?? 0 }).map(
                      (_, row) => (
                        <tr key={row}>
                          {columns.map((f) => (
                            <td
                              key={f.name}
                              className={
                                "text-nowrap small" +
                                (f.synthetic ? " newmap-synthetic" : "")
                              }
                            >
                              {f.samples[row]}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {/* Step 4. What the map is called, and what its file is called. */}
          <Row className="align-items-start g-3">
            <Col xs={12} lg={4}>
              <Form.Group controlId="formTitle">
                <Form.Label>
                  <strong>4.</strong> Map name
                </Form.Label>
                <Form.Control
                  type="input"
                  placeholder="e.g. Saudi Arabia Provinces"
                  value={data.title ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const title = e.target.value;
                    setData((d) => ({
                      ...d,
                      title,
                      // Kept in step with the title until the slug is edited by
                      // hand, so the usual case needs typing in one place.
                      fileJson: slugEdited ? d.fileJson : slugify(title),
                    }));
                  }}
                />
                <Form.Text>Shown in the puzzle list and on the page.</Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12} lg={4}>
              <Form.Group controlId="formname">
                <Form.Label>File name</Form.Label>
                <Form.Control
                  type="input"
                  placeholder="e.g. saudi_arabia_provinces"
                  value={data.fileJson}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSlugEdited(true);
                    setData({ ...data, fileJson: e.target.value });
                  }}
                />
                <Form.Text>
                  Becomes maps/&lt;name&gt;.geojson and the puzzle&apos;s URL.
                </Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12} lg={3} className="pt-lg-4">
              <Button
                variant="primary"
                type="button"
                onClick={onSaveHandler}
                disabled={
                  !data.table || !data.name || !data.fileJson || !data.title
                }
              >
                Import map
              </Button>
            </Col>
          </Row>
        </Form>
      </Col>
    </React.Fragment>
  );
}

export default NewMap;
