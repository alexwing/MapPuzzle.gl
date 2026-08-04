import React from "react";
import { WikiInfoLang } from "../models/Interfaces";
import { Nav, NavDropdown } from "react-bootstrap";

import { langName } from "../lib/Utils";
import  { Translate } from "react-bootstrap-icons";
import "./LangSelector.css";

interface LangSelectorProps {
  langs: WikiInfoLang[];
  currentLang: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectLang: (event : any) => void;
}


function LangSelector({ langs = [] as WikiInfoLang[],currentLang, onSelectLang }: LangSelectorProps) : JSX.Element {

  const navDropdownTitle = (
    <span>
      <Translate size={24} className="me-2" />
      <span className="d-xl-inline d-lg-none ">{currentLang}</span>
    </span>
  );

  return (
    <React.Fragment>
      <Nav>
        <NavDropdown
          className="lang-selector"
          title={navDropdownTitle}
          id="nav-dropdown"          
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
