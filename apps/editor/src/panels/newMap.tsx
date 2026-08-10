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
  } as MapGeneratorModel);

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
      if (layers.length === 1) {
        setData((d) => ({
          ...d,
          table: layers[0],
          fileJson: d.fileJson || layers[0],
        }));
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

  /** Which role a field plays, or none. Empty id and colour fall back to order. */
  const roleOf = (field: string): string => {
    if (data.name === field) return "name";
    if (data.id === field) return "id";
    if (data.mapColor === field) return "color";
    return "";
  };

  const assignRole = (field: string, role: string) => {
    setData((d) => ({
      ...d,
      // A field can only hold one role, so taking it clears it elsewhere.
      name: role === "name" ? field : d.name === field ? "" : d.name,
      id: role === "id" ? field : d.id === field ? "" : d.id,
      mapColor: role === "color" ? field : d.mapColor === field ? "" : d.mapColor,
    }));
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
                Pick which field names the pieces. The id and colour are
                optional: without them the pieces are numbered in name order,
                which is what most sources need.
              </Form.Text>
              <div className="newmap-fields">
                <Table size="sm" bordered hover className="mb-0">
                  <thead>
                    <tr>
                      {fields.map((f) => (
                        <th key={f.name} className="align-top">
                          <div className="text-nowrap">{f.name}</div>
                          <div className="fw-normal text-muted small mb-1">
                            {f.numeric ? "number" : "text"}
                            {f.unique ? ", all different" : ""}
                          </div>
                          <Form.Select
                            size="sm"
                            value={roleOf(f.name)}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              assignRole(f.name, e.target.value)
                            }
                          >
                            <option value="">—</option>
                            <option value="name">Name</option>
                            <option value="id" disabled={!f.numeric}>
                              Piece id{f.numeric ? "" : " (needs numbers)"}
                            </option>
                            <option value="color" disabled={!f.numeric}>
                              Colour{f.numeric ? "" : " (needs numbers)"}
                            </option>
                          </Form.Select>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: fields[0]?.samples.length ?? 0 }).map(
                      (_, row) => (
                        <tr key={row}>
                          {fields.map((f) => (
                            <td key={f.name} className="text-nowrap small">
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

          {/* Step 4. Name the map and create it. */}
          <Row className="align-items-end">
            <Col xs={12} lg={5}>
              <Form.Group controlId="formname">
                <Form.Label>
                  <strong>4.</strong> Map file name
                </Form.Label>
                <Form.Control
                  type="input"
                  placeholder="e.g. saudi_arabia_provinces"
                  value={data.fileJson}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setData({ ...data, fileJson: e.target.value });
                  }}
                />
                <Form.Text>
                  Becomes maps/&lt;name&gt;.geojson and the puzzle&apos;s URL.
                </Form.Text>
              </Form.Group>
            </Col>
            <Col xs={12} lg={3}>
              <Button
                variant="primary"
                type="button"
                onClick={onSaveHandler}
                disabled={!data.table || !data.name || !data.fileJson}
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
