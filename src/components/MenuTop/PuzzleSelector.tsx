import React, { useEffect } from "react";
import { Button, Col, Form, Modal, NavDropdown, Row } from "react-bootstrap";
import "./PuzzleSelector.css";
import Puzzles from "../../../backend/src/models/puzzles";
import { Regions } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";
import BootstrapTable, {
  ColumnDescription,
  PaginationOptions,
  SelectRowProps,
} from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";

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
  const [puzzles, setPuzzles] = React.useState([] as Puzzles[]);
  const [searchName, setSearchName] = React.useState("");
  const ref: any = React.useRef();

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
    cleanFilters();
    setShowIn(show);
    if (show) {
      loadRegions();
    }
  }, [show]);

  useEffect(() => {
    setSelectedPuzzle(0);
    PuzzleService.getPuzzlesByFilters(
      selectedRegion,
      selectedSubRegion,
      searchName
    ).then((data: Puzzles[]) => {
      setPuzzles(data);
    });
  }, [selectedRegion, selectedSubRegion, searchName]);

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

  const columns: ColumnDescription<any, any>[] = [
    {
      dataField: "id",
      text: "id",
      hidden: true,
    },
    {
      dataField: "icon",
      text: "",
      formatter: (cell: any, row: any) => {
        return <img src={cell} alt={row.name} />;
      },
      headerFormatter: cleanButton(),
      classes: "icon",
    },
    {
      dataField: "name",
      text: "Name",
      sort: false,
      classes: "name",
      headerClasses: "name-header",
      headerFormatter: inputByName(),
    },
    {
      dataField: "region.region",
      text: "Region",
      sort: false,
      classes: "region",
      headerClasses: "region-header",
      headerFormatter: dropdownRegion(),
    },
    {
      dataField: "region.subregion",
      text: "Sub Region",
      sort: false,
      classes: "subregion",
      headerClasses: "subregion-header",
      headerFormatter: dropdownSubregion(),
    },
  ] as ColumnDescription[];

  const selectRow = {
    mode: "radio",
    hideSelectColumn: true,
    clickToSelect: true,
    bgColor: "#b8daff",
    onSelect: (row, _isSelect, _rowIndex, _e) => {
      setSelectedPuzzle(row.id);
    },
  } as SelectRowProps<any>;

  const paginationOptions: PaginationOptions = {
    sizePerPage: 10,
    showTotal: true,
    hideSizePerPage: true,
    hidePageListOnlyOnePage: true,
    withFirstAndLast: false,
    alwaysShowAllBtns: true,
  } as PaginationOptions;

  const onSearchNameChange = (e: any) => {
    setSearchName(e.target.value);
    loadRegions();
  };

  return (
    <React.Fragment>
      <Modal
        show={showIn}
        onHide={handleCancel}
        centered
        size="lg"
        className="puzzle-selector-modal"
      >
        <Modal.Body>
          <Row>
            <Col xs={12} md={12}>
              <div className="puzzle-selector">
                <BootstrapTable
                  ref={ref}
                  keyField="id"
                  data={puzzles}
                  columns={columns}
                  selectRow={selectRow}
                  striped
                  hover
                  condensed
                  bordered={false}
                  pagination={paginationFactory(paginationOptions)}
                />
              </div>
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

  function cleanFilters() {
    setSearchName("");
    setSelectedSubRegion(0);
    setSelectedPuzzle(0);
    setSelectedRegion(0);
    //unselet table
    if (ref && typeof ref === "object") {
      if (ref.current !== undefined && ref.current !== null) {
          ref.current.selectionContext.selected = [];
      }
    }
  }

  function cleanButton() {
    return (_column: any, _colIndex: any, _components: any) => {
      return (
        <Button
          className="clean-icon"
          variant="link"
          size="sm"
          onClick={() => {
            cleanFilters();
          }}
        >
          <span></span>
        </Button>
      );
    };
  }

  function inputByName() {
    return (_column: any, _colIndex: any, _components: any) => {
      return (
        <Form.Control
          type="text"
          placeholder="Find by name"
          value={searchName}
          onChange={(e) => onSearchNameChange(e)}
        />
      );
    };
  }
  function dropdownRegion(): (
    column: any,
    colIndex: any,
    components: any
  ) => JSX.Element {
    return (_column: any, _colIndex: any, _components: any) => {
      return (
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
      );
    };
  }

  function dropdownSubregion() {
    return (_column: any, _colIndex: any, _components: any) => {
      return (
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
      );
    };
  }
}

export default PuzzleSelector;
