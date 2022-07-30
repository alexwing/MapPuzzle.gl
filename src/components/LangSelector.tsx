import React from "react";
import { WikiInfoLang, WikiInfoPiece } from "../models/Interfaces";
import { Nav, NavDropdown } from "react-bootstrap";
import { getCookie } from "react-simple-cookie-store";

function LangSelector({
  pieceInfo = {
    title: "",
    contents: [],
    langs: [],
  } as WikiInfoPiece,
  onSelectLang,
}: any) {

    
  const currentLang = () => {
    const puzzleLanguage = getCookie("puzzleLanguage") || "en";
    //find in pieceInfo.langs the lang with the same lang as puzzleLanguage
    const pieceLang = pieceInfo.langs.find(
      (x: any) => x.lang === puzzleLanguage
    );
    if (typeof pieceLang === "object" && pieceLang !== null) {
      return langName(pieceLang);
    } else {
      return "";
    }
  };
  const langName = (piece: WikiInfoLang) => {
    if (piece.autonym === "") {
      return piece.langname;
    } else {
      if (piece.autonym === piece.langname) {
        return piece.langname;
      } else {
        return piece.langname + " (" + piece.autonym + ")";
      }
    }
  };
  const navDropdownTitle = (
    <span>
      <span className="lang-selector-icon"></span>
      <span className="d-none d-lg-inline d-lg-none">{currentLang()}</span>
    </span>
  );

  return (
    <React.Fragment>
      <Nav>
        <NavDropdown
          className="lang-selector"
          title={navDropdownTitle}
          id="puzzle"
        >
          {pieceInfo.langs.map((c: any) => (
            <NavDropdown.Item id={c.lang} key={c.lang} onClick={onSelectLang}>
              {langName(c)}
            </NavDropdown.Item>
          ))}
        </NavDropdown>
      </Nav>
    </React.Fragment>
  );
}

export default LangSelector;
