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
import { ConfigService } from "@mappuzzle/core";

interface PuzzleOptionsProps {
  onRefocus: () => void;
  onFullScreen: () => void;
  handleInfo: () => void;
  onShowWikiInfo: (val: boolean) => void;
  handleShow: () => void;
}

function PuzzleOptions({
  onRefocus,
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
      labelClass: "d-lg-none",
      visible: true,
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
      labelClass: "d-lg-none",
      visible: true,
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
      labelClass: "d-lg-none",
      visible: true,
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
      labelClass: "d-lg-none",
      visible: true,
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
      labelClass: "d-lg-none",
      visible: true,
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
      labelClass: "d-lg-none",
      visible: true,
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
      <Form>
        {/* Filtered, not hidden with CSS: a disabled feature should leave
            nothing in the DOM for the player to find. */}
        {buttons
          .filter((button) => button.visible)
          .map((button, index) => (
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
