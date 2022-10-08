import React, { useEffect } from "react";
import Navbar from "react-bootstrap/Navbar";
import Info from "../Info";
import PuzzleSelector from "./PuzzleSelector";
import PuzzleOptions from "./PuzzleOptions";
import ConfirmDialog from "./ConfirmDialog";
import LangSelector from "../LangSelector";
import { WikiInfoLang } from "../../models/Interfaces";
import { PuzzleService } from "../../services/puzzleService";
import { setCookie } from "react-simple-cookie-store";
import Languages from "../../../backend/src/models/languages";
import { ConfigService } from "../../services/configService";
import { getCurrentLang, languagesToWikiInfoLang } from "../../lib/Utils";
import { Button, Nav } from "react-bootstrap";

function MenuTop({
  name,
  onSelectMap,
  content,
  onResetGame,
  onFullScreen,
  onRefocus,
  onShowWikiInfo,
  onShowEditor,
  onLangChange,
}: any) {
  const [show, setShow] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [showSelectPuzzle, setShowSelectPuzzle] = React.useState(false);
  const [langs, setLangs] = React.useState([] as WikiInfoLang[]);
  const [currentLang, setCurrentLang] = React.useState("");

  useEffect(() => {
    setShow(false);
    setShowInfo(false);
    getLanguages();
  }, [content]);

  const getLanguages = () => {
    PuzzleService.getLanguages().then((languages: Languages[]) => {
      const wikiInfoLang: WikiInfoLang[] = languagesToWikiInfoLang(languages);
      setLangs(wikiInfoLang);
      setCurrentLang(getCurrentLang(wikiInfoLang));
    });
  };

  const handleCancel = () => {
    setShow(false);
    setShowInfo(false);
  };

  const handleOK = () => {
    setShow(false);
    setShowInfo(false);
    onResetGame();
  };

  const handleShow = () => {
    setShow(true);
    setShowInfo(false);
  };
  const handleShowInfo = () => {
    setShow(false);
    setShowInfo(true);
  };
  const handleLangChange = (e: any) => {
    const lang = e.target.id;
    setCookie("puzzleLanguage", lang, ConfigService.cookieDays);
    setCurrentLang(getCurrentLang(langs));
    onLangChange(lang);
  };
  const handleShowSelectPuzzle = () => {
    setShowSelectPuzzle(true);
  };
  const handleHideSelectPuzzle = () => {
    setShowSelectPuzzle(false);
  };

  return (
    <React.Fragment>
      <Navbar bg="light" expand="lg">
        <Navbar.Brand>
          <img src="./logo192.png" alt="" />
          {name}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Button
              id="puzzleSelect"
              variant="outline-primary"
              onClick={handleShowSelectPuzzle}
            >
              Select Puzzle
            </Button>
            <PuzzleSelector
              show={showSelectPuzzle}
              puzzles={content}
              onSelectMap={onSelectMap}
              onHidePuzzleSelector={handleHideSelectPuzzle}
            />
          </Nav>
          <LangSelector
            langs={langs}
            onSelectLang={handleLangChange}
            currentLang={currentLang}
          ></LangSelector>
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
      <Info show={showInfo} content={content} InfoClose={handleCancel} />
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
