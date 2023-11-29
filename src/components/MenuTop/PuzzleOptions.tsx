import React, { useCallback, useContext } from "react";
import { Form } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";
import ThemeContext from "../ThemeProvider";
import * as Icon from "react-bootstrap-icons";
import Tooltip from "react-bootstrap/Tooltip";
import { OverlayTrigger } from "react-bootstrap";
import { useMediaQuery } from 'react-responsive';
import { setCookie } from "react-simple-cookie-store";
import { ConfigService } from "../../services/configService";

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
    setCookie("theme", theme === "dark" ? "light" : "dark", ConfigService.cookieDays);
  };

  const { t } = useTranslation();
  const size = 28;

  const buttons = [
    { id: "refocus",
      variant: "none",
      onClickHandler: onRefocus,
      tooltip: t("topMenu.refocus"),
      icon: Icon.FullscreenExit,
      iconSize: size,
      iconColor: "",
      iconClass: "me-2",
      label: t("topMenu.refocus"),
      labelClass: "d-lg-none"
    },
    { id: "fullscreen",
      variant: "none",
      onClickHandler: onFullScreen,
      tooltip: t("topMenu.fullscreen"),
      icon: Icon.Fullscreen,
      iconSize: size,
      iconColor: "",
      iconClass: "me-2",
      label: t("topMenu.fullscreen"),
      labelClass: "d-lg-none"
    },
    { id: "theme",
      variant: "none",
      onClickHandler: onThemeChange,
      tooltip: theme === "light" ? t("topMenu.dark") : t("topMenu.light"),
      icon: theme === "light" ? Icon.Moon : Icon.Sun,
      iconSize: size,
      iconColor: "",
      iconClass: "me-2",
      label: theme === "light" ? t("topMenu.dark") : t("topMenu.light"),
      labelClass: "d-lg-none"
    },
    { id: "info",
      variant: "none",
      onClickHandler: handleInfo,
      tooltip: t("topMenu.about"),
      icon: Icon.InfoCircle,
      iconSize: size,
      iconColor: "",
      iconClass: "me-2",
      label: t("topMenu.about"),
      labelClass: "d-lg-none"
    },
    { id: "wiki",
      variant: "none",
      onClickHandler: onShowWikiInfoHandler,
      tooltip: t("topMenu.wikiInfo"),
      icon: Icon.Wikipedia,
      iconSize: size,
      iconColor: "",
      iconClass: "me-2",
      label: t("topMenu.wikiInfo"),
      labelClass: "d-lg-none"
    },
    { id: "reset",
      variant: "none",
      onClickHandler: handleShow,
      tooltip: t("topMenu.resetGame"),
      icon: Icon.ArrowClockwise,
      iconSize: size,
      iconColor: "",
      iconClass: "me-2",
      label: t("topMenu.resetGame"),
      labelClass: "d-lg-none"
    },
    {
      id: "editor",
      variant: "none",
      onClickHandler: onShowEditorHandler,
      tooltip: t("topMenu.editor"),
      icon: Icon.PencilSquare,
      iconSize: size,
      iconColor: "green",
      iconClass: "me-2",
      label: t("topMenu.editor"),
      labelClass: "d-lg-none"
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlay = useCallback((button: any) => {
    return (useMediaQuery({ minWidth: 992 }) ? (
      <Tooltip id={`tooltip-${button.id}`}>{button.tooltip}</Tooltip>
    ) : <span></span>) as JSX.Element;
  }, []); 

  return (
    <React.Fragment>
      <Form inline>
        {buttons.map((button, index) => (
                    <OverlayTrigger
            key={index}
            placement="bottom"
            overlay={overlay(button)}
          >
          <Button
            key={index}
            id={button.id}
            variant={button.variant}
            onClick={button.onClickHandler}
          >
            <span>
              <button.icon size={button.iconSize} className={button.iconClass} />
              <span className={button.labelClass}>{button.label}</span>
            </span>
          </Button>
          </OverlayTrigger>
        ))}

      </Form>
    </React.Fragment>
  );
}
export default PuzzleOptions;
