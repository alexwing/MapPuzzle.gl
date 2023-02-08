import React, { useState, useEffect } from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import AlertMessage from "../components/AlertMessage";
import LoadingDialog from "../components/LoadingDialog";
import { AlertModel, MapGeneratorModel } from "../models/Interfaces";
//import { setCookie, getCookie } from "react-simple-cookie-store";
import { BackMapCreatorService } from "../services/BackMapCreatorService";

function NewMap(): JSX.Element | null {
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alert, setAlert] = useState({
    title: "",
    message: "",
    type: "danger",
  } as AlertModel);

  const [shpFile, setShpFile] = useState<File | null>(null);

  //string list for table and column dropdowns
  const [tableList, setTableList] = useState([]);
  const [columnList, setColumnList] = useState([]);
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
    }
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

  //load columns when table is selected
  useEffect(() => {
    const loadColumns = async () => {
      const columns = await BackMapCreatorService.getColumns(data.table);
      if (columns.data) {
        setColumnList(columns.data);
      }
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
      if (result) {
        setShowAlert(true);
        setAlert({
          title: "Success",
          message: result.msg,
          type: "success",
        } as AlertModel);
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

  const importShapefileHandler = async () => {
    setLoading(true);
    if (shpFile == null || data.fileJson === "") {
      setShowAlert(true);
      setAlert({
        title: "Error",
        message: "Please select a shapefile",
        type: "danger",
      } as AlertModel);
      setLoading(false);
    } else {
      const result = await BackMapCreatorService.importShapefile(
        shpFile,
        data.fileJson
      );
      await new Promise((r) => setTimeout(r, 1000));
      loadTables();
      if (result) {
        setShowAlert(true);
        setAlert({
          title: "Success",
          message: result.msg,
          type: "success",
        } as AlertModel);
      } else {
        setShowAlert(true);
        setAlert({
          title: "Error",
          message: "Error generating geojson",
          type: "danger",
        } as AlertModel);
      }
      setLoading(false);
    }
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
          <Row>
            <Col xs={6} lg={6}>
              <Form.Group className="mb-12" controlId="formname">
                <Form.Label>Json File name: </Form.Label>
                <Form.Control
                  size="sm"
                  type="input"
                  placeholder="Enter puzzle name"
                  value={data.fileJson}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setData({ ...data, fileJson: e.target.value });
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-12" controlId="table">
                <Form.Label>Table: </Form.Label>
                <Form.Control
                  size="sm"
                  as="select"
                  value={data.table}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setData({ ...data, table: e.target.value });
                  }}
                >
                  {tableList.map((table) => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col xs={6} lg={6}>
              <Form.Group className="mb-12" controlId="column">
                <Form.Label>Field to piece ID: </Form.Label>
                <Form.Control
                  size="sm"
                  as="select"
                  value={data.id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setData({ ...data, id: e.target.value });
                  }}
                >
                  {columnList.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-12" controlId="column">
                <Form.Label>Field to Name: </Form.Label>
                <Form.Control
                  size="sm"
                  as="select"
                  value={data.name}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setData({ ...data, name: e.target.value });
                  }}
                >
                  {columnList.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-12" controlId="column">
                <Form.Label>Field to Color: </Form.Label>
                <Form.Control
                  size="sm"
                  as="select"
                  value={data.mapColor}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setData({ ...data, mapColor: e.target.value });
                  }}
                >
                  {columnList.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col xs={12} lg={12}>
              <Form.Group className="mb-3" controlId="formFile">
                <Form.Label>Import GeoJson</Form.Label>
                <Form.Control
                  size="sm"
                  type="file"
                  accept=".zip"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (e.target.files) {
                      setShpFile(e.target.files[0]);
                    }
                  }}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col
              xs={12}
              lg={12}
              style={{ textAlign: "center", marginTop: "50px" }}
            >
              <Button
                style={{ marginTop: "10px", marginLeft: "10px" }}
                variant="secondary"
                type="button"
                onClick={importShapefileHandler}
              >
                Import Shape to Postgis
              </Button>
              <Button
                style={{ marginTop: "10px", marginLeft: "30px" }}
                variant="primary"
                type="button"
                onClick={onSaveHandler}
              >
                Generate GeoJson File
              </Button>
            </Col>
          </Row>
        </Form>
      </Col>
    </React.Fragment>
  );
}

export default NewMap;
