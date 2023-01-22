import React from "react";
import { Form } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { ConfigService } from "../../services/configService";
import { useTranslation } from "react-i18next";

interface PuzzleOptionsProps {
  onRefocus: () => void;
  onFullScreen: () => void;
  handleInfo: () => void;
  onShowWikiInfo: (val:boolean) => void;
  handleShow: () => void;
  onShowEditor: (val:boolean) => void;
}

function PuzzleOptions({
  onRefocus,
  onFullScreen,
  handleInfo,
  onShowWikiInfo,
  handleShow,
  onShowEditor,
}: PuzzleOptionsProps) : JSX.Element {

  const onShowWikiInfoHandler = () => {
    onShowWikiInfo(true);
  }
  const onShowEditorHandler = () => {
    onShowEditor(true);
  }
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Form inline>
        <Button id="refocus" variant="outline-secondary" onClick={onRefocus}>
          <span className="navbar-refocus-icon"></span>
        </Button>
        <Button
          id="fullscreen"
          variant="outline-secondary"
          onClick={onFullScreen}
        >
          <span className="navbar-full-icon"></span>
        </Button>
        <Button id="info" variant="outline-secondary" onClick={handleInfo}>
          <span className="navbar-info-icon"></span>
        </Button>
        <Button id="wiki" variant="outline-secondary" onClick={onShowWikiInfoHandler}>
          <span className="navbar-wiki-icon"></span>
        </Button>
        <Button id="reset" variant="outline-primary" onClick={handleShow}>
        {t("topMenu.resetGame")}
        </Button>
        {ConfigService.editorEnabled ? (
          <Button id="editor" variant="outline-primary" onClick={onShowEditorHandler}>
            {t("topMenu.editor")}
          </Button>
        ) : null}
      </Form>
    </React.Fragment>
  );
}
export default PuzzleOptions;
