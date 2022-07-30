import React, { useEffect } from "react";
import Navbar from "react-bootstrap/Navbar";
import Info from "../Info";
import PuzzleSelector from "./PuzzleSelector";
import PuzzleOptions from "./PuzzleOptions";
import ConfirmDialog from "./ConfirmDialog";

function MenuTop({ 
  name,
  onSelectMap,
  content,
  onResetGame,
  onFullScreen,
  onRefocus,
  onShowWikiInfo,
  onShowEditor
 }: any) {
  const [show, setShow] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);

  useEffect(() => {
    setShow(false);
    setShowInfo(false);
  }
  , [content]);

  const handleCancel = () => {
    setShow(false);
    setShowInfo(false);
  }

  const handleOK = () => {
    setShow(false);
    setShowInfo(false);
    onResetGame();
  }

  const handleShow = () => {
    setShow(true);
    setShowInfo(false);
  } 
  const handleShowInfo = () => {
    setShow(false);
    setShowInfo(true);
  }


  return (
    <React.Fragment>
        <Navbar bg="light" expand="lg">
          <Navbar.Brand>
            <img src="./logo192.png" alt="" />
            {name}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <PuzzleSelector
              puzzles={content}
              onSelectMap={onSelectMap}
            />
            <PuzzleOptions
              onRefocus={onRefocus}
              onFullScreen={onFullScreen}
              handleInfo={handleShowInfo}
              handleShow={handleShow}
              onShowWikiInfo={onShowWikiInfo}
              onShowEditor={onShowEditor}
            />
          </Navbar.Collapse>
        </Navbar>
        <Info
          show={showInfo}
          content={content}
          InfoClose={handleCancel}
        />
        <ConfirmDialog
          show={show}
          handleCancel={handleCancel}
          handleOK={handleOK}
          title="Do you surrender?"
          message="Click yes, if you want to start a new game"
        />
      </React.Fragment>
  );
}
export default MenuTop;
  