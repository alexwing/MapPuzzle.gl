import React, { useContext } from "react";
import { Form } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";

import * as Icon from "react-bootstrap-icons";
import ThemeContext from "../../components/ThemeProvider";

interface PuzzleOptionsProps {
  onFullScreen: () => void;
  handleInfo: () => void;
  onShowWikiInfo: (val: boolean) => void;
  handleShow: () => void;
}

function PuzzleOptions({
  onFullScreen,
  handleInfo,
  onShowWikiInfo,
  handleShow,
}: PuzzleOptionsProps): JSX.Element {
  const { theme, setTheme } = useContext(ThemeContext);

  const onShowWikiInfoHandler = () => {
    onShowWikiInfo(true);
  };

  const onThemeChange = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const { t } = useTranslation();
  const size = 28;

  return (
    <React.Fragment>
      <Form inline>
        <Button
          id="fullscreen"
          variant="none"
          onClick={onFullScreen}
        >
          <Icon.Fullscreen size={size} />
        </Button>
        <Button id="theme" variant="none" onClick={onThemeChange}>
          {theme === "light" ? <Icon.Moon size={size} /> : <Icon.Sun size={size} />}
        </Button>
        <Button id="info" variant="none" onClick={handleInfo}>
          <Icon.InfoCircle size={size} />
        </Button>
        <Button id="wiki" variant="none" onClick={onShowWikiInfoHandler}>
          <Icon.Wikipedia size={size} />
        </Button>
        <Button
          id="reset"
          variant="none"
          onClick={handleShow}
        >
          <Icon.ArrowClockwise size={size} />
        </Button>
      </Form>
    </React.Fragment>
  );
}
export default PuzzleOptions;
