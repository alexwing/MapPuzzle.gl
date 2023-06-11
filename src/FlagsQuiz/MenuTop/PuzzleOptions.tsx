import React from "react";
import { Form } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { ConfigService } from "../../services/configService";
import { useTranslation } from "react-i18next";

interface PuzzleOptionsProps {
  onFullScreen: () => void;
  handleInfo: () => void;
  onShowWikiInfo: (val:boolean) => void;
  handleShow: () => void;
}

function PuzzleOptions({
  onFullScreen,
  handleInfo,
  onShowWikiInfo,
  handleShow,
}: PuzzleOptionsProps) : JSX.Element {
  const onShowWikiInfoHandler = () => {
    onShowWikiInfo(true);
  }

  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Form inline>
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
      </Form>
    </React.Fragment>
  );
}
export default PuzzleOptions;
