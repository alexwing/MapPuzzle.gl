import React, { useContext } from "react";
import { Form } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { ConfigService } from "../../services/configService";
import { useTranslation } from "react-i18next";
import ThemeContext from "../ThemeProvider";
import * as Icon from "react-bootstrap-icons";

interface PuzzleOptionsProps {
  onRefocus: () => void;
  onFullScreen: () => void;
  handleInfo: () => void;
  onShowWikiInfo: (val: boolean) => void;
  handleShow: () => void;
  onShowEditor: (val: boolean) => void;
}

function PuzzleOptions({
  onRefocus,
  onFullScreen,
  handleInfo,
  onShowWikiInfo,
  handleShow,
  onShowEditor,
}: PuzzleOptionsProps): JSX.Element {
  const { theme, setTheme } = useContext(ThemeContext);

  const onShowWikiInfoHandler = () => {
    onShowWikiInfo(true);
  };
  const onShowEditorHandler = () => {
    onShowEditor(true);
  };
  const onThemeChange = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Form inline>
        <Button id="refocus" variant="none" onClick={onRefocus}>          
          <Icon.FullscreenExit size={22} />
        </Button>
        <Button id="fullscreen" variant="none" onClick={onFullScreen}>
          <Icon.Fullscreen size={22} />
        </Button>
        <Button id="theme" variant="none" onClick={onThemeChange}>
          {theme === "light" ? <Icon.Moon size={22} /> : <Icon.Sun size={22} />}
        </Button>
        <Button id="info" variant="none" onClick={handleInfo}>
          <Icon.InfoCircle size={22} />
        </Button>
        <Button id="wiki" variant="none" onClick={onShowWikiInfoHandler}>
          <Icon.Wikipedia size={22} />
        </Button>
        <Button id="reset" variant="none"  onClick={handleShow} aria-tooltip={t("topMenu.resetGame")}>
          <Icon.ArrowClockwise size={22} 
          />
        </Button>
        {ConfigService.editorEnabled ? (
          <Button
            id="editor"
            variant="none"
            onClick={onShowEditorHandler}
            aria-tooltip={t("topMenu.editor")}
          >
            <Icon.PencilSquare size={22} color="green" />
          </Button>
        ) : null}
      </Form>
    </React.Fragment>
  );
}
export default PuzzleOptions;
