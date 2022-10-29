import React from "react";
import { WikiInfoLang } from "../models/Interfaces";
import { Nav, NavDropdown } from "react-bootstrap";

import { langName } from "../lib/Utils";


interface LangSelectorProps {
  langs: WikiInfoLang[];
  currentLang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectLang: (event : any) => void;
}


function LangSelector({ langs = [] as WikiInfoLang[],currentLang, onSelectLang }: LangSelectorProps) {

  const navDropdownTitle = (
    <span>
      <span className="lang-selector-icon"></span>
      <span className="d-none d-lg-inline d-lg-none">{currentLang}</span>
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
          {langs.map((c: WikiInfoLang) => (
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
