import React, { useEffect, useState } from "react";
import { secondsToTime } from "../lib/Utils";
import GameTime from "../lib/GameTime";
import { setCookie } from "react-simple-cookie-store";
import { ConfigService } from "../services/configService";
import { useTranslation } from "react-i18next";

interface TimerProps {
  puzzleSelected: number;
}

function Timer({ puzzleSelected }: TimerProps) : JSX.Element {
  const { t } = useTranslation();
  const [time, setTime] = useState({
    h: 0,
    m: 0,
    s: 0,
  });

  useEffect(() => {
    const interval = setInterval(countDown, 1000);
    return () => clearInterval(interval);
  }, []);


  function countDown(): void {
    GameTime.seconds++;
    //save time each 5 seconds
    if (GameTime.seconds % 5 === 0) {
      setCookie(
        "seconds" + puzzleSelected,
        GameTime.seconds.toString(),
        ConfigService.cookieDays
      );
    }
    setTime(secondsToTime(GameTime.seconds));
  }
  function getTime() {
    if (time.h > 0) {
      return (
        <ul id="hours">
          <li>
            <b>{time.h} </b> {t("hours")}
          </li>
          <li>
            <b>{time.m}</b> {t("minutes")}
          </li>
          <li>
            <b>{time.s}</b> {t("seconds")}
          </li>
        </ul>
      );
    } else if (time.m > 0) {
      return (
        <ul id="minutes">
          <li>
            <b>{time.m}</b> {t("minutes")}
          </li>
          <li>
            <b>{time.s}</b> {t("seconds")}
          </li>
        </ul>
      );
    } else if (time.s > 0) {
      return (
        <ul id="seconds">
          <li>
            <b>{time.s}</b> {t("seconds")}
          </li>
        </ul>
      );
    } else {
      return <ul></ul>;
    }
  }
  return (
    <React.Fragment>
      <div className="timer">{getTime()}</div>{" "}
    </React.Fragment>
  );
}
export default Timer;
