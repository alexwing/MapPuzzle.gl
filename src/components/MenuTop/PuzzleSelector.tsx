import React, { useEffect, useId } from "react";
import { Button, Col, Modal, NavDropdown, Row, Table } from "react-bootstrap";
import Puzzles from "../../../backend/src/models/puzzles";
import { Regions } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";

function PuzzleSelector({
  show = false,
  onSelectMap,
  onHidePuzzleSelector,
}: any) {
  const [selectedPuzzle, setSelectedPuzzle] = React.useState(0);
  const [selectedRegion, setSelectedRegion] = React.useState(0);
  const [selectedSubRegion, setSelectedSubRegion] = React.useState(0);
  const [showIn, setShowIn] = React.useState(false);
  const [allregions, setAllregions] = React.useState([] as Regions[]);
  const [regions, setRegions] = React.useState([] as Regions[]);
  const [subregions, setSubregions] = React.useState([] as Regions[]);
  const identify = "id_" + useId().replaceAll(":", "");
  const [puzzles, setPuzzles] = React.useState([] as Puzzles[]);
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
    setSelectedSubRegion(0);
    setSelectedPuzzle(0);
    setSelectedRegion(0);
    setShowIn(show);
    if (show) {
      loadRegions();
    }
  }, [show]);


  useEffect(() => {
    setSelectedPuzzle(0);
    PuzzleService.getPuzzlesByFilters(selectedRegion, selectedSubRegion).then(
      (data: Puzzles[]) => {
        setPuzzles(data);
      }
    );
  }, [ selectedRegion, selectedSubRegion]);

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
      setSelectedRegion(0);
      setSubregions(allregions);
    } else {
      setSelectedRegion(parseInt(val.target.id));
      let subregions: Regions[] = [];
      allregions.forEach((element) => {
        if (element.regionCode === parseInt(val.target.id)) {
          subregions.push(element);
        }
      });
      setSubregions(subregions);
    }
    setSelectedSubRegion(0);
  };
  const onSelectSubRegion = (val: any) => {
    setSelectedSubRegion(parseInt(val.target.id));
  };

  const navDropdownRegionsTitle = (
    <span>
      <span className="d-none d-lg-inline d-lg-none">
        {selectedRegion === 0
          ? "Regions"
          : regions.find((x) => x.regionCode === selectedRegion)?.region}
      </span>
    </span>
  );

  const navDropdownSubRegionsTitle = (
    <span>
      <span className="d-none d-lg-inline d-lg-none">
        {selectedSubRegion === 0
          ? "Sub Regions"
          : subregions.find((x) => x.subregionCode === selectedSubRegion)
              ?.subregion}
      </span>
    </span>
  );

  return (
    <React.Fragment>
      <Modal show={showIn} onHide={handleCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Select a Puzzle to play</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={6} md={6}>
              <NavDropdown title={navDropdownRegionsTitle} id="nav-dropdown">
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
              <NavDropdown title={navDropdownSubRegionsTitle} id="nav-dropdown">
                <NavDropdown.Item id="0" onClick={onSelectSubRegion}>
                  All
                </NavDropdown.Item>
                {subregions.map((subregion) => (
                  <NavDropdown.Item
                    id={subregion.subregionCode}
                    key={subregion.subregionCode}
                    eventKey={subregion.subregion}
                    onClick={onSelectSubRegion}
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
            Play
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
