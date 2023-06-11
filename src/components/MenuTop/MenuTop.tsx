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
import "../../i18n/config";
import { useTranslation } from "react-i18next";
import WikiInfo from "../WikiInfo";

interface MenuTopProps {
  name: string;
  onSelectMap: (any) => void;
  onResetGame: () => void;
  onFullScreen: () => void;
  onRefocus: () => void;
  onShowEditor: (val: boolean) => void;
  onLangChange: (lang: string) => void;
  puzzleSelected: number;
}

function MenuTop({
  name,
  onSelectMap,
  onResetGame,
  onFullScreen,
  onRefocus,
  onShowEditor,
  onLangChange,
  puzzleSelected,
}: MenuTopProps): JSX.Element {
  const [show, setShow] = React.useState(false);
  const [showInfo, setShowInfo] = React.useState(false);
  const [showSelectPuzzle, setShowSelectPuzzle] = React.useState(false);
  const [langs, setLangs] = React.useState([] as WikiInfoLang[]);
  const [currentLang, setCurrentLang] = React.useState("");
  const [showWikiInfo, setShowWikiInfo] = React.useState(false);
  const { t, i18n } = useTranslation();
  const [wikiInfoUrl, setWikiInfoUrl] = React.useState("");

  useEffect(() => {
    setShow(false);
    setShowInfo(false);
    getLanguages();
  }, []);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLangChange = (e: any) => {
    const lang = e.target.id;
    setCookie("puzzleLanguage", lang, ConfigService.cookieDays);
    //change lang in i18n
    i18n.changeLanguage(lang);
    setCurrentLang(getCurrentLang(langs));
    onLangChange(lang);
  };
  const handleShowSelectPuzzle = () => {
    setShowSelectPuzzle(true);
  };
  const handleHideSelectPuzzle = () => {
    setShowSelectPuzzle(false);
  };
  const onShowWikiInfoHandler = (show: boolean) => () => {
    if (show) {
      PuzzleService.getPuzzleWiki(puzzleSelected).then((url) => {
        setWikiInfoUrl(url);
        setShowWikiInfo(true)
      });
    }else{
      setShowWikiInfo(false)
    }
  };
  const onOpenFlagsQuiz = () => {
    //open new windows to play flags quiz
    window.open("/?flagQuiz", "_blank");
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
              {t("topMenu.selectPuzzle")}
            </Button>
            <Button
              id="flagsQuiz"
              variant="outline-primary"
              onClick={onOpenFlagsQuiz}
            >
              <img className="logo" src="./logoFlagsQuiz192.png" alt="" />
              <span>{t("topMenu.playFlagsQuiz")}</span>
              <img className="new" src="./new-icon.png" alt="" />
            </Button>            
            <PuzzleSelector
              show={showSelectPuzzle}
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
            onShowWikiInfo={onShowWikiInfoHandler(true)}
            onShowEditor={onShowEditor}
          />
        </Navbar.Collapse>
      </Navbar>
      <Info name={name} show={showInfo} InfoClose={handleCancel} />
      <ConfirmDialog
        show={show}
        handleCancel={handleCancel}
        handleOK={handleOK}
        title={t("topMenu.surrenderTitle")}
        message={t("topMenu.surrenderMessage")}
      />
      <WikiInfo
        show={showWikiInfo}
        url={wikiInfoUrl}
        onHide={onShowWikiInfoHandler(false)}
        piece={0}
        enableFlags={false}
        puzzleSelected={0}
      />
    </React.Fragment>
  );
}
export default MenuTop;
