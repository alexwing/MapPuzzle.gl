import React from "react";
import { WikiInfoLang } from "../models/Interfaces";
import { Nav, NavDropdown } from "react-bootstrap";

import { langName } from "../lib/Utils";


function LangSelector({ langs = [] as WikiInfoLang[],currentLang, onSelectLang }: any) {

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
          {langs.map((c: any) => (
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
