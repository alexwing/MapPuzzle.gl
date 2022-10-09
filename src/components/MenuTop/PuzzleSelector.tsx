import React, { useEffect, useId } from "react";
import { Button, Col, Modal, NavDropdown, Row, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import Puzzles from "../../../backend/src/models/puzzles";
import { Regions } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";

function PuzzleSelector({
  show = false,
  puzzles = [],
  onSelectMap,
  onHidePuzzleSelector,
}: any) {
  const [selectedPuzzle, setSelectedPuzzle] = React.useState(0);
  const [showIn, setShowIn] = React.useState(false);
  const [allregions, setAllregions] = React.useState([] as Regions[]);
  const [regions, setRegions] = React.useState([] as Regions[]);
  const [subregions, setSubregions] = React.useState([] as Regions[]);
  const identify = "id_" + useId().replaceAll(":", "");
  const handleCancel = () => {
    onHidePuzzleSelector();
    setSelectedPuzzle(0);
    setShowIn(false);
  };
  const handleOK = () => {
    onHidePuzzleSelector();
    onSelectMap(selectedPuzzle);
    setShowIn(false);
  };

  //on load show modal
  useEffect(() => {
    setShowIn(show);
    if (show) {
      loadRegions();
    }
  }, [show]);

  const loadRegions = () => {
    PuzzleService.getRegions().then((data: Regions[]) => {
      //get regions from subregions
      let regions: Regions[] = [];
      data.forEach((element) => {
        if (regions.findIndex((x) => x.regionCode === element.regionCode) < 0) {
          regions.push({
            regionCode: element.regionCode,
            region: element.region,
          } as Regions);
        }
      });
      setRegions(regions);
      setSubregions(data);
      setAllregions(data);
    });
  };
  const className = (c: any, pieceSelected: number) => {
    return parseInt(c.id) === pieceSelected ? "table-primary" : "";
  };

  const onSelectMapClick = (val: any) => {
    setSelectedPuzzle(val.target.parentNode.id);
  };
  const onSelectRegion = (val: any) => {
    if (val.target.id === "0") {
      setSubregions(allregions);
    } else {
      let subregions: Regions[] = [];
      allregions.forEach((element) => {
        if (element.regionCode === parseInt(val.target.id)) {
          subregions.push(element);
        }
      });
      setSubregions(subregions);
    }
  };

  return (
    <React.Fragment>
      <Modal show={showIn} onHide={handleCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Select a Puzzle to play</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={6} md={6}>
              <NavDropdown title="Regions" id="nav-dropdown">
                <NavDropdown.Item id="0" onClick={onSelectRegion}>
                  All
                </NavDropdown.Item>

                {regions.map((region) => (
                  <NavDropdown.Item
                    id={region.regionCode}
                    key={region.regionCode}
                    eventKey={region.region}
                    onClick={onSelectRegion}
                  >
                    {region.region}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            </Col>
            <Col xs={6} md={6}>
              <NavDropdown title="Subregions" id="nav-dropdown">
                {subregions.map((subregion) => (
                  <NavDropdown.Item
                    key={subregion.subregionCode}
                    eventKey={subregion.subregion}
                    onClick={onSelectRegion}
                  >
                    {subregion.subregion}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            </Col>
          </Row>
          <Row>
            <Col xs={12} md={12}>
              <Table striped bordered hover size="sm" id={identify}>
                <tbody>
                  {puzzles.map((c: Puzzles) => (
                    <tr
                      key={c.id}
                      onClick={onSelectMapClick}
                      id={c.id.toString()}
                      className={className(c, selectedPuzzle)}
                    >
                      <td>
                        <img src={c.icon} alt={c.name} />
                      </td>
                      <td>{c.name}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={handleOK}
            disabled={selectedPuzzle === 0}
          >
            Yes
          </Button>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </React.Fragment>
  );
}
export default PuzzleSelector;
